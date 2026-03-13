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

export interface RegisterResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getStoredUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
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
          localStorage.setItem(this.tokenKey, res.token);
          localStorage.setItem(this.userKey, JSON.stringify(res.user));
        })
      );
  }

  register(name: string, email: string, password: string, passwordConfirmation: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
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
      tap((user) => localStorage.setItem(this.userKey, JSON.stringify(user))),
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
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}
