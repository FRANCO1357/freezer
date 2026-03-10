import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

/** Icone Phosphor Icons per i tag (classe: ph ph-{value}) - stile moderno */
export const TAG_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Nessuna' },
  { value: 'fish', label: 'Pesce' },
  { value: 'egg', label: 'Uovo' },
  { value: 'egg-crack', label: 'Uovo (rotto)' },
  { value: 'cooking-pot', label: 'Cucina' },
  { value: 'carrot', label: 'Carota' },
  { value: 'avocado', label: 'Avocado' },
  { value: 'orange', label: 'Arancia' },
  { value: 'flower', label: 'Fiore' },
  { value: 'drop', label: 'Goccia' },
  { value: 'snowflake', label: 'Neve / Freddo' },
  { value: 'basket', label: 'Cestino' },
  { value: 'coffee', label: 'Bevanda' },
  { value: 'wine', label: 'Vino' },
  { value: 'tree', label: 'Verdura / Albero' },
  { value: 'sun', label: 'Sole' },
  { value: 'cheese', label: 'Formaggio' },
  { value: 'bug', label: 'Carne / Animale' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'hamburger', label: 'Hamburger' },
  { value: 'fork-knife', label: 'Cibo' },
  { value: 'leaf', label: 'Foglia' },
];

@Injectable({ providedIn: 'root' })
export class TagService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  list(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.api}/tags`);
  }

  create(name: string, icon?: string | null, color?: string | null): Observable<Tag> {
    return this.http.post<Tag>(`${this.api}/tags`, { name, icon: icon || null, color: color || null });
  }

  update(id: number, name: string, icon?: string | null, color?: string | null): Observable<Tag> {
    return this.http.put<Tag>(`${this.api}/tags/${id}`, { name, icon: icon ?? null, color: color ?? null });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/tags/${id}`);
  }
}
