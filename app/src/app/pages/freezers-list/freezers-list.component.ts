import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FreezerService, Freezer } from '../../services/freezer.service';

@Component({
  selector: 'app-freezers-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './freezers-list.component.html',
})
export class FreezersListComponent implements OnInit {
  private freezerService = inject(FreezerService);
  freezers = signal<Freezer[]>([]);
  loading = signal(true);
  newName = '';
  adding = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.freezerService.list().subscribe({
      next: (list) => {
        this.freezers.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  add(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.adding.set(true);
    this.freezerService.create(name).subscribe({
      next: () => {
        this.newName = '';
        this.adding.set(false);
        this.load();
      },
      error: () => this.adding.set(false),
    });
  }

  remove(f: Freezer, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(`Eliminare il freezer "${f.name}" e tutti i suoi prodotti?`)) return;
    this.freezerService.delete(f.id).subscribe({
      next: () => this.load(),
    });
  }
}
