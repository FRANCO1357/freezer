import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FreezerService } from '../../services/freezer.service';
import { ProductService, Product } from '../../services/product.service';
import { PRODUCT_ICONS } from '../../constants/product-icons';

@Component({
  selector: 'app-freezer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './freezer-detail.component.html',
})
export class FreezerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private freezerService = inject(FreezerService);
  private productService = inject(ProductService);

  protected readonly productIcons = PRODUCT_ICONS;

  freezerName = signal<string>('');
  products = signal<Product[]>([]);
  loading = signal(true);
  freezerId = computed(() => Number(this.route.snapshot.paramMap.get('id')));

  nameFilter = signal('');
  iconFilter = signal<string | null>(null);
  sortOrder = signal<'newest' | 'oldest'>('newest');

  filteredProducts = computed(() => {
    const list = this.products();
    const name = this.nameFilter().trim().toLowerCase();
    const iconKey = this.iconFilter();
    const order = this.sortOrder();
    let result = list.filter((p) => {
      if (name && !p.name.toLowerCase().includes(name)) return false;
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
    const id = this.freezerId();
    this.freezerService.get(id).subscribe({
      next: (freezer) => {
        this.freezerName.set(freezer.name);
        this.products.set((freezer as { products: Product[] }).products ?? []);
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
