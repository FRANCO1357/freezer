import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FreezerService, Freezer } from '../../services/freezer.service';
import { TagService, Tag, TAG_ICON_OPTIONS } from '../../services/tag.service';

@Component({
  selector: 'app-freezers-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './freezers-list.component.html',
})
export class FreezersListComponent implements OnInit {
  private freezerService = inject(FreezerService);
  private tagService = inject(TagService);
  protected readonly tagIconOptions = TAG_ICON_OPTIONS;
  freezers = signal<Freezer[]>([]);
  tags = signal<Tag[]>([]);
  loading = signal(true);
  newName = '';
  newTagName = '';
  newTagIcon = '';
  newTagColor = '#6c757d';
  adding = signal(false);
  addingTag = signal(false);
  editingTagId = signal<number | null>(null);
  editingTagName = '';
  editingTagIcon = '';
  editingTagColor = '';
  savingTag = signal(false);

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
    this.tagService.list().subscribe((list) => this.tags.set(list));
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

  /** Colore testo leggibile su sfondo (bianco o nero) */
  textColor(hex: string): string {
    if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return '#fff';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000' : '#fff';
  }

  addTag(): void {
    const name = this.newTagName.trim();
    if (!name) return;
    this.addingTag.set(true);
    const icon = this.newTagIcon || null;
    const color = this.newTagColor && this.newTagColor !== '#6c757d' ? this.newTagColor : null;
    this.tagService.create(name, icon, color).subscribe({
      next: () => {
        this.newTagName = '';
        this.newTagIcon = '';
        this.newTagColor = '#6c757d';
        this.addingTag.set(false);
        this.tagService.list().subscribe((list) => this.tags.set(list));
      },
      error: () => this.addingTag.set(false),
    });
  }

  startEditTag(t: Tag): void {
    this.editingTagId.set(t.id);
    this.editingTagName = t.name;
    this.editingTagIcon = t.icon ?? '';
    this.editingTagColor = t.color ?? '';
  }

  cancelEditTag(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.editingTagId.set(null);
  }

  saveEditTag(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const id = this.editingTagId();
    if (id == null) return;
    const name = this.editingTagName.trim();
    if (!name) return;
    this.savingTag.set(true);
    const icon = this.editingTagIcon === '' ? null : this.editingTagIcon;
    const color = this.editingTagColor || null;
    this.tagService.update(id, name, icon, color).subscribe({
      next: () => {
        this.savingTag.set(false);
        this.editingTagId.set(null);
        this.tagService.list().subscribe((list) => this.tags.set(list));
      },
      error: () => {
        this.savingTag.set(false);
      },
    });
  }

  removeTag(id: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm('Eliminare questo tag?')) return;
    this.tagService.delete(id).subscribe({
      next: () => this.tagService.list().subscribe((list) => this.tags.set(list)),
    });
  }
}
