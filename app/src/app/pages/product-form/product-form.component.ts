import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FreezerService, Freezer } from '../../services/freezer.service';
import { ProductService, Product, ProductForm } from '../../services/product.service';
import { ProductImageUrlPipe } from '../../pipes/product-image-url.pipe';
import { PRODUCT_ICONS, productIconUrl } from '../../constants/product-icons';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ProductImageUrlPipe],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private freezerService = inject(FreezerService);
  private productService = inject(ProductService);

  protected readonly productIcons = PRODUCT_ICONS;
  protected readonly iconUrl = productIconUrl;

  freezers = signal<Freezer[]>([]);
  product = signal<Product | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  imagePreview = signal<string | null>(null);
  imageFile = signal<File | null>(null);

  isEdit = computed(() => this.product() != null);
  productId = computed(() => this.route.snapshot.paramMap.get('id'));

  form: FormGroup = this.fb.group({
    freezer_id: [null as number | null, Validators.required],
    name: ['', Validators.required],
    brand: [''],
    expiry_date: [null as string | null],
    quantity: [null as number | null],
    quantity_unit: [''],
    pieces: [null as number | null],
    notes: [''],
    icon: ['' as string],
  });

  ngOnInit(): void {
    const id = this.productId();
    const freezerIdParam = this.route.snapshot.queryParamMap.get('freezer_id');

    this.freezerService.list().subscribe((list) => this.freezers.set(list));

    if (id && id !== 'nuovo') {
      this.productService.get(Number(id)).subscribe({
        next: (p) => {
          this.product.set(p);
          this.form.patchValue({
            freezer_id: p.freezer_id,
            name: p.name,
            brand: p.brand ?? '',
            expiry_date: p.expiry_date ? p.expiry_date.toString().slice(0, 10) : null,
            quantity: p.quantity,
            quantity_unit: p.quantity_unit ?? '',
            pieces: p.pieces ?? null,
            notes: p.notes ?? '',
            icon: p.icon ?? '',
          });
          if (p.image_url) this.imagePreview.set(p.image_url);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.loading.set(false);
      if (freezerIdParam) {
        this.form.patchValue({ freezer_id: Number(freezerIdParam) });
      }
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.imageFile.set(file);
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.imageFile.set(null);
    if (!this.product()?.image_url) this.imagePreview.set(null);
  }

  changePieces(delta: number): void {
    const current = this.form.get('pieces')?.value ?? 0;
    const next = Math.max(1, (Number(current) || 0) + delta);
    this.form.patchValue({ pieces: next });
  }

  submit(): void {
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);

    const payload: Partial<ProductForm> = {
      freezer_id: v.freezer_id,
      name: v.name,
      brand: v.brand || null,
      expiry_date: v.expiry_date || null,
      quantity: v.quantity ?? null,
      quantity_unit: v.quantity_unit || null,
      pieces: v.pieces ?? null,
      notes: v.notes || null,
      icon: v.icon || null,
      image: this.imageFile() ?? undefined,
    };

    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');

    if (this.isEdit()) {
      this.productService.update(this.product()!.id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          if (returnTo === 'tutti-i-prodotti') {
            this.router.navigate(['/area-riservata/tutti-i-prodotti']);
          } else {
            this.router.navigate(['/area-riservata/freezers', v.freezer_id]);
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message ?? 'Errore salvataggio');
        },
      });
    } else {
      this.productService.create(payload as ProductForm).subscribe({
        next: (created) => {
          this.saving.set(false);
          if (returnTo === 'tutti-i-prodotti') {
            this.router.navigate(['/area-riservata/tutti-i-prodotti']);
          } else {
            this.router.navigate(['/area-riservata/freezers', created.freezer_id]);
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message ?? 'Errore salvataggio');
        },
      });
    }
  }
}
