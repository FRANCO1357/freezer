import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FreezerService } from '../../services/freezer.service';
import { ProductService, Product } from '../../services/product.service';
import { PRODUCT_ICONS } from '../../constants/product-icons';
import { TABLE_PAGE_SIZE } from '../../constants/pagination';
import { FormatQuantityPipe } from '../../pipes/format-quantity.pipe';
import { TruncatePipe } from '../../pipes/truncate.pipe';

@Component({
  selector: 'app-freezer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FormatQuantityPipe, TruncatePipe],
  templateUrl: './freezer-detail.component.html',
})
export class FreezerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private freezerService = inject(FreezerService);
  private productService = inject(ProductService);

  protected readonly productIcons = PRODUCT_ICONS;

  /** Balloon mobile: testo e posizione per nome prodotto completo */
  balloonVisible = signal(false);
  balloonText = signal('');
  balloonStyle = signal<{ top: number; left: number }>({ top: 0, left: 0 });

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

  currentPage = signal(1);
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredProducts().length / TABLE_PAGE_SIZE))
  );
  effectivePage = computed(() =>
    Math.min(this.currentPage(), this.totalPages())
  );
  paginatedProducts = computed(() => {
    const all = this.filteredProducts();
    const page = this.effectivePage();
    const start = (page - 1) * TABLE_PAGE_SIZE;
    return all.slice(start, start + TABLE_PAGE_SIZE);
  });

  setPage(page: number): void {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
  }

  protected readonly PAGE_SIZE = TABLE_PAGE_SIZE;

  paginationRange = computed(() => {
    const total = this.filteredProducts().length;
    const page = this.effectivePage();
    const start = total === 0 ? 0 : (page - 1) * TABLE_PAGE_SIZE + 1;
    const end = Math.min(page * TABLE_PAGE_SIZE, total);
    return { start, end, total };
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.effectivePage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const delta = 2;
    let start = Math.max(1, current - delta);
    let end = Math.min(total, current + delta);
    if (end - start < 2 * delta) {
      if (start === 1) end = Math.min(total, start + 2 * delta);
      else start = Math.max(1, end - 2 * delta);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
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

  showNameBalloon(event: Event, fullName: string): void {
    event.preventDefault();
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.balloonText.set(fullName);
    this.balloonStyle.set({
      top: rect.top - 8,
      left: rect.left,
    });
    this.balloonVisible.set(true);
    setTimeout(() => {
      const close = () => {
        this.balloonVisible.set(false);
        document.removeEventListener('click', close);
      };
      document.addEventListener('click', close);
    }, 0);
  }
}
