import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Freezer {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class FreezerService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  list(): Observable<Freezer[]> {
    return this.http.get<Freezer[]>(`${this.api}/freezers`);
  }

  get(id: number): Observable<Freezer & { products: unknown[] }> {
    return this.http.get<Freezer & { products: unknown[] }>(`${this.api}/freezers/${id}`);
  }

  create(name: string): Observable<Freezer> {
    return this.http.post<Freezer>(`${this.api}/freezers`, { name });
  }

  update(id: number, name: string): Observable<Freezer> {
    return this.http.put<Freezer>(`${this.api}/freezers/${id}`, { name });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/freezers/${id}`);
  }
}
