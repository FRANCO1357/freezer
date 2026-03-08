import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  getStoredUser(): User | null {
    const raw = sessionStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((res) => {
          sessionStorage.setItem(this.tokenKey, res.token);
          sessionStorage.setItem(this.userKey, JSON.stringify(res.user));
        })
      );
  }

  logout(): Observable<void> {
    const token = this.getToken();
    if (!token) {
      this.clearSession();
      return of(undefined);
    }
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of(undefined);
      })
    );
  }

  fetchUser(): Observable<User | null> {
    if (!this.getToken()) return of(null);
    return this.http.get<User>(`${this.apiUrl}/user`).pipe(
      tap((user) => sessionStorage.setItem(this.userKey, JSON.stringify(user))),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  doLogout(): void {
    this.logout().subscribe(() => this.router.navigate(['/login']));
  }

  private clearSession(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
  }
}
