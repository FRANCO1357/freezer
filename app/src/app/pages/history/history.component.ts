import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryService, FreezerLog } from '../../services/history.service';
import { PRODUCT_ICONS } from '../../constants/product-icons';
import { TABLE_PAGE_SIZE } from '../../constants/pagination';
import { FormatQuantityPipe } from '../../pipes/format-quantity.pipe';

const MODIFIED_FIELD_LABELS: Record<string, string> = {
  name: 'nome',
  freezer: 'freezer',
  quantity: 'peso',
  pieces: 'pezzi',
};

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatQuantityPipe],
  templateUrl: './history.component.html',
})
export class HistoryComponent implements OnInit {
  private historyService = inject(HistoryService);
  logs = signal<FreezerLog[]>([]);
  loading = signal(true);

  /** Data selezionata per il filtro (YYYY-MM-DD) o vuoto per vedere tutto */
  dateFilter = signal<string>('');

  filteredLogs = computed(() => {
    const list = this.logs();
    const dateStr = this.dateFilter().trim();
    if (!dateStr) return list;
    const filterDate = new Date(dateStr);
    filterDate.setHours(0, 0, 0, 0);
    return list.filter((log) => {
      const logDate = new Date(log.created_at);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === filterDate.getTime();
    });
  });

  currentPage = signal(1);
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredLogs().length / TABLE_PAGE_SIZE))
  );
  effectivePage = computed(() =>
    Math.min(this.currentPage(), this.totalPages())
  );
  paginatedLogs = computed(() => {
    const all = this.filteredLogs();
    const page = this.effectivePage();
    const start = (page - 1) * TABLE_PAGE_SIZE;
    return all.slice(start, start + TABLE_PAGE_SIZE);
  });

  setPage(page: number): void {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
  }

  protected readonly PAGE_SIZE = TABLE_PAGE_SIZE;

  paginationRange = computed(() => {
    const total = this.filteredLogs().length;
    const page = this.effectivePage();
    const start = total === 0 ? 0 : (page - 1) * TABLE_PAGE_SIZE + 1;
    const end = Math.min(page * TABLE_PAGE_SIZE, total);
    return { start, end, total };
  });

  /** Numeri di pagina da mostrare (1..totalPages o intorno alla pagina corrente) */
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.effectivePage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const delta = 2;
    let start = Math.max(1, current - delta);
    let end = Math.min(total, current + delta);
    if (end - start < 2 * delta) {
      if (start === 1) end = Math.min(total, start + 2 * delta);
      else end = Math.min(total, current + delta);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  /** Testo da mostrare accanto a "Modificato" (es. "nome", "peso e pezzi") */
  getModificationLabel(log: FreezerLog): string {
    const fields = log.modified_fields ?? [];
    if (fields.length === 0) return '';
    return fields.map((f) => MODIFIED_FIELD_LABELS[f] ?? f).join(' e ');
  }

  /** Nome della categoria dall'id icona (es. icona_brodo → Brodo) */
  iconLabel(iconId: string | null | undefined): string {
    if (!iconId) return '';
    return PRODUCT_ICONS.find((o) => o.id === iconId)?.label ?? iconId;
  }

  ngOnInit(): void {
    this.historyService.list().subscribe({
      next: (list) => {
        this.logs.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
