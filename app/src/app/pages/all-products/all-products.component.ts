import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';
import { FreezerService, Freezer } from '../../services/freezer.service';
import { PRODUCT_ICONS } from '../../constants/product-icons';
import { FormatQuantityPipe } from '../../pipes/format-quantity.pipe';

@Component({
  selector: 'app-all-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FormatQuantityPipe],
  templateUrl: './all-products.component.html',
})
export class AllProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private freezerService = inject(FreezerService);

  protected readonly productIcons = PRODUCT_ICONS;

  products = signal<Product[]>([]);
  freezers = signal<Freezer[]>([]);
  loading = signal(true);

  nameFilter = signal('');
  freezerFilterId = signal<number | null>(null);
  iconFilter = signal<string | null>(null);
  sortOrder = signal<'newest' | 'oldest'>('newest');

  filteredProducts = computed(() => {
    const list = this.products();
    const name = this.nameFilter().trim().toLowerCase();
    const freezerId = this.freezerFilterId();
    const iconKey = this.iconFilter();
    const order = this.sortOrder();
    let result = list.filter((p) => {
      if (name && !p.name.toLowerCase().includes(name)) return false;
      if (freezerId != null && p.freezer_id !== freezerId) return false;
      if (iconKey != null && p.icon !== iconKey) return false;
      return true;
    });
    result = [...result].sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return order === 'newest' ? db - da : da - db;
    });
    return result;
  });

  ngOnInit(): void {
    this.freezerService.list().subscribe((list) => this.freezers.set(list));
    this.productService.list().subscribe({
      next: (list) => {
        this.products.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  deleteProduct(p: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(`Rimuovere "${p.name}" dal freezer?`)) return;
    this.productService.delete(p.id).subscribe({
      next: () => {
        this.products.update((list) => list.filter((x) => x.id !== p.id));
      },
    });
  }
}
