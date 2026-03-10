import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { ProductImageUrlPipe } from '../../pipes/product-image-url.pipe';

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductImageUrlPipe],
  templateUrl: './product-view.component.html',
})
export class ProductViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  product = signal<Product | null>(null);
  loading = signal(true);

  /** Colore testo leggibile su sfondo hex. */
  tagTextColor(hex: string): string {
    if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return '#fff';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000' : '#fff';
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
