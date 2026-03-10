import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryService, FreezerLog } from '../../services/history.service';
import { PRODUCT_ICONS } from '../../constants/product-icons';

const MODIFIED_FIELD_LABELS: Record<string, string> = {
  name: 'nome',
  freezer: 'freezer',
  quantity: 'peso/quantità',
  pieces: 'pezzi',
};

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
