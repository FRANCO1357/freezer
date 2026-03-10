import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FreezerService } from '../../services/freezer.service';
import { ProductService, Product } from '../../services/product.service';
import { TagService, Tag } from '../../services/tag.service';

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
  private tagService = inject(TagService);
  freezerName = signal<string>('');
  products = signal<Product[]>([]);
  tags = signal<Tag[]>([]);
  loading = signal(true);
  freezerId = computed(() => Number(this.route.snapshot.paramMap.get('id')));

  nameFilter = signal('');
  tagFilterId = signal<number | null>(null);
  sortOrder = signal<'newest' | 'oldest'>('newest');

  filteredProducts = computed(() => {
    const list = this.products();
    const name = this.nameFilter().trim().toLowerCase();
    const tagId = this.tagFilterId();
    const order = this.sortOrder();
    let result = list.filter((p) => {
      if (name && !p.name.toLowerCase().includes(name)) return false;
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
    const id = this.freezerId();
    this.tagService.list().subscribe((tags) => this.tags.set(tags));
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
