import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FreezerLog {
  id: number;
  user_id: number;
  freezer_id: number;
  action: 'added' | 'removed' | 'quantity_updated';
  modified_fields?: string[] | null;
  product_id: number | null;
  product_name: string;
  icon: string | null;
  brand: string | null;
  product_image_path: string | null;
  expiry_date: string | null;
  quantity: number | null;
  quantity_unit: string | null;
  pieces: number | null;
  notes: string | null;
  tags_snapshot: string[] | null;
  created_at: string;
  freezer?: { id: number; name: string };
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  list(): Observable<FreezerLog[]> {
    return this.http.get<FreezerLog[]>(`${this.api}/history`);
  }
}
