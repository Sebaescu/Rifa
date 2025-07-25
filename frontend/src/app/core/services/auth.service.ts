import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        // Validar que el usuario tenga las propiedades necesarias
        if (user && user.id && user.email) {
          this.tokenSubject.next(token);
          this.currentUserSubject.next(user);
        } else {
          // Datos corruptos, limpiar
          this.clearAuthData();
        }
      } catch (error) {
        // Error al parsear JSON, limpiar
        console.error('Error parsing user data from localStorage:', error);
        this.clearAuthData();
      }
    }
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register/`, data)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login/`, data)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.API_URL}/logout/`, {})
      .pipe(
        tap(() => this.clearAuthData())
      );
  }

  verifyEmail(data: { email: string, code: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/verify-email/`, data);
  }

  resendEmailVerification(data: { email: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/resend-verification/`, data);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/profile/`);
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/profile/update/`, data)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          localStorage.setItem('user', JSON.stringify(user));
        })
      );
  }

  passwordReset(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/password-reset/`, { email });
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.tokenSubject.next(response.token);
    this.currentUserSubject.next(response.user);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  forceLogout(): void {
    this.clearAuthData();
  }

  clearStorage(): void {
    this.clearAuthData();
  }

  isAuthenticated(): boolean {
    const token = this.tokenSubject.value || localStorage.getItem('token');
    const user = this.currentUserSubject.value;

    if (!token || !user) {
      return false;
    }

    // Validar que el usuario tenga las propiedades básicas necesarias
    if (!user.id || !user.email) {
      this.clearAuthData();
      return false;
    }

    return true;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }
}
