import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `
    <app-navbar *ngIf="showNavbar"></app-navbar>
    <router-outlet></router-outlet>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'RifApp';
  showNavbar = true;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Siempre mostrar navbar, solo cambiar su comportamiento
        this.showNavbar = true;
      });

    // Event listeners para manejar el cierre de la pestaña/ventana
    this.setupSessionManagement();

    // Verificar si la sesión actual es válida
    this.verifyCurrentSession();
  }

  private verifyCurrentSession() {
    // Verificar si hay un token almacenado y si sigue siendo válido
    if (this.authService.isAuthenticated()) {
      this.authService.verifyToken().subscribe({
        next: (isValid) => {
          if (!isValid) {
            console.log('Token inválido, limpiando sesión');
            this.authService.clearAuthData();
            this.router.navigate(['/auth/login']);
          }
        },
        error: (error) => {
          console.log('Error verificando token:', error);
          this.authService.clearAuthData();
          this.router.navigate(['/auth/login']);
        }
      });
    }
  }

  ngOnDestroy() {
    // Cleanup listeners
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('unload', this.handleUnload);
  }

  private setupSessionManagement(): void {
    // Listener para cuando se va a cerrar la pestaña/ventana
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    window.addEventListener('unload', this.handleUnload.bind(this));

    // Listener para visibilidad de la página (cuando se cambia de pestaña)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    // Este evento se dispara antes de cerrar la pestaña
    console.log('App: Tab/window is about to close, clearing session');
  };

  private handleUnload = (event: Event): void => {
    // Este evento se dispara cuando se cierra la pestaña
    console.log('App: Tab/window closed, session should be cleared');
    this.authService.clearStorage();
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      console.log('App: Page is hidden (tab switched or minimized)');
    } else if (document.visibilityState === 'visible') {
      console.log('App: Page is visible again');
      // Opcional: verificar si la sesión sigue siendo válida
      if (!this.authService.isAuthenticated()) {
        this.router.navigate(['/auth/login']);
      }
    }
  };
}
