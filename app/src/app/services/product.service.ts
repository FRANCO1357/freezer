import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Tag {
  id: number;
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface Freezer {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  freezer_id: number;
  name: string;
  brand: string | null;
  image_path: string | null;
  image_url: string | null;
  expiry_date: string | null;
  quantity: number | null;
  quantity_unit: string | null;
  pieces: number | null;
  notes: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
  freezer?: Freezer;
  tags?: Tag[];
}

export interface ProductForm {
  freezer_id: number;
  name: string;
  brand?: string | null;
  expiry_date?: string | null;
  quantity?: number | null;
  quantity_unit?: string | null;
  pieces?: number | null;
  notes?: string | null;
  icon?: string | null;
  image?: File;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  list(freezerId?: number): Observable<Product[]> {
    let params = new HttpParams();
    if (freezerId != null) {
      params = params.set('freezer_id', freezerId);
    }
    return this.http.get<Product[]>(`${this.api}/products`, { params });
  }

  get(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.api}/products/${id}`);
  }

  create(form: ProductForm): Observable<Product> {
    const body = new FormData();
    body.set('freezer_id', String(form.freezer_id));
    body.set('name', form.name);
    if (form.brand) body.set('brand', form.brand);
    if (form.expiry_date) body.set('expiry_date', form.expiry_date);
    if (form.quantity != null) body.set('quantity', String(form.quantity));
    if (form.quantity_unit) body.set('quantity_unit', form.quantity_unit ?? '');
    if (form.pieces != null) body.set('pieces', String(form.pieces));
    if (form.notes) body.set('notes', form.notes);
    if (form.icon) body.set('icon', form.icon);
    if (form.image) body.set('image', form.image);
    return this.http.post<Product>(`${this.api}/products`, body);
  }

  update(id: number, form: Partial<ProductForm>): Observable<Product> {
    const body = new FormData();
    if (form.freezer_id != null) body.set('freezer_id', String(form.freezer_id));
    body.set('name', form.name ?? '');
    body.set('brand', form.brand ?? '');
    body.set('expiry_date', form.expiry_date ?? '');
    body.set('quantity', form.quantity != null ? String(form.quantity) : '');
    body.set('quantity_unit', form.quantity_unit ?? '');
    body.set('pieces', form.pieces != null ? String(form.pieces) : '');
    body.set('notes', form.notes ?? '');
    body.set('icon', form.icon ?? '');
    if (form.image) body.set('image', form.image);
    return this.http.post<Product>(`${this.api}/products/${id}/update`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/products/${id}`);
  }
}
