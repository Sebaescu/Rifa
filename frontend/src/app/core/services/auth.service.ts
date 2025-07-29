import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, of } from 'rxjs';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl + '/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');

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
        console.error('Error parsing user data from sessionStorage:', error);
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
    console.log('AuthService: Starting logout process');
    return this.http.post(`${this.API_URL}/logout/`, {})
      .pipe(
        tap({
          next: (response) => {
            console.log('AuthService: Logout successful', response);
            this.clearAuthData();
          },
          error: (error) => {
            console.error('AuthService: Logout failed', error);
            // Even if server logout fails, clear local data
            this.clearAuthData();
          }
        })
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
          sessionStorage.setItem('user', JSON.stringify(user));
        })
      );
  }

  passwordReset(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/password-reset/`, { email });
  }

  private handleAuthResponse(response: AuthResponse): void {
    console.log('AuthService: Handling auth response', response);
    sessionStorage.setItem('token', response.token);
    sessionStorage.setItem('user', JSON.stringify(response.user));
    this.tokenSubject.next(response.token);
    this.currentUserSubject.next(response.user);
  }

  public clearAuthData(): void {
    console.log('AuthService: Clearing auth data');
    // Clear both localStorage and sessionStorage to be safe
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
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
    const token = this.tokenSubject.value || sessionStorage.getItem('token');
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

  // Método para verificar si el token sigue siendo válido en el servidor
  verifyToken(): Observable<boolean> {
    return this.http.get<{valid: boolean}>(`${this.API_URL}/verify-token/`)
      .pipe(
        tap(response => {
          if (!response.valid) {
            this.clearAuthData();
          }
        }),
        map(response => response.valid),
        catchError(() => {
          this.clearAuthData();
          return of(false);
        })
      );
  }

  // Método para limpiar sesión cuando se cierra la pestaña
  clearSessionOnTabClose(): void {
    this.clearAuthData();
  }
}
