import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';
import { FreezerService, Freezer } from '../../services/freezer.service';
import { TagService, Tag } from '../../services/tag.service';

@Component({
  selector: 'app-all-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './all-products.component.html',
})
export class AllProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private freezerService = inject(FreezerService);
  private tagService = inject(TagService);
  products = signal<Product[]>([]);
  freezers = signal<Freezer[]>([]);
  tags = signal<Tag[]>([]);
  loading = signal(true);

  nameFilter = signal('');
  freezerFilterId = signal<number | null>(null);
  tagFilterId = signal<number | null>(null);
  sortOrder = signal<'newest' | 'oldest'>('newest');

  filteredProducts = computed(() => {
    const list = this.products();
    const name = this.nameFilter().trim().toLowerCase();
    const freezerId = this.freezerFilterId();
    const tagId = this.tagFilterId();
    const order = this.sortOrder();
    let result = list.filter((p) => {
      if (name && !p.name.toLowerCase().includes(name)) return false;
      if (freezerId != null && p.freezer_id !== freezerId) return false;
      if (tagId != null && !p.tags?.some((t) => t.id === tagId)) return false;
      return true;
    });
    result = [...result].sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return order === 'newest' ? db - da : da - db;
    });
    return result;
  });

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
    this.freezerService.list().subscribe((list) => this.freezers.set(list));
    this.tagService.list().subscribe((list) => this.tags.set(list));
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
