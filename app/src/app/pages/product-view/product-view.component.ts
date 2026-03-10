import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { ProductImageUrlPipe } from '../../pipes/product-image-url.pipe';
import { PRODUCT_ICONS } from '../../constants/product-icons';

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductImageUrlPipe],
  templateUrl: './product-view.component.html',
})
export class ProductViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  protected readonly productIcons = PRODUCT_ICONS;

  product = signal<Product | null>(null);
  loading = signal(true);

  /** Se presente, usato per il link Modifica così dopo il salvataggio si torna alla lista corretta */
  get returnTo(): Record<string, string> | null {
    const v = this.route.snapshot.queryParamMap.get('returnTo');
    return v ? { returnTo: v } : null;
  }

  iconLabel(iconId: string | null | undefined): string {
    if (!iconId) return '';
    return this.productIcons.find((o) => o.id === iconId)?.label ?? iconId;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.productService.get(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
