import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FreezerService, Freezer } from '../../services/freezer.service';
import { TagService, Tag } from '../../services/tag.service';
import { ProductService, Product, ProductForm } from '../../services/product.service';
import { ProductImageUrlPipe } from '../../pipes/product-image-url.pipe';

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
  private tagService = inject(TagService);
  private productService = inject(ProductService);

  freezers = signal<Freezer[]>([]);
  tags = signal<Tag[]>([]);
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
    tag_ids: [[] as number[]],
  });

  ngOnInit(): void {
    const id = this.productId();
    const freezerIdParam = this.route.snapshot.queryParamMap.get('freezer_id');

    this.freezerService.list().subscribe((list) => this.freezers.set(list));
    this.tagService.list().subscribe((list) => this.tags.set(list));

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
            tag_ids: p.tags?.map((t) => t.id) ?? [],
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

  /** Colore testo leggibile su sfondo hex (bianco o nero). */
  tagTextColor(hex: string): string {
    if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return '#fff';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000' : '#fff';
  }

  toggleTag(tagId: number): void {
    const arr = this.form.get('tag_ids')?.value ?? [];
    const set = new Set(arr);
    if (set.has(tagId)) set.delete(tagId);
    else set.add(tagId);
    this.form.patchValue({ tag_ids: [...set] });
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
      tag_ids: v.tag_ids ?? [],
      image: this.imageFile() ?? undefined,
    };

    if (this.isEdit()) {
      this.productService.update(this.product()!.id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/area-riservata/freezers', v.freezer_id]);
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
          this.router.navigate(['/area-riservata/freezers', created.freezer_id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message ?? 'Errore salvataggio');
        },
      });
    }
  }
}
