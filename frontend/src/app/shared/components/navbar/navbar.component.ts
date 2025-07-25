import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: false,
  template: `
    <mat-toolbar color="primary">
      <mat-toolbar-row>
        <button mat-icon-button (click)="toggleSidebar()" *ngIf="currentUser">
          <mat-icon>menu</mat-icon>
        </button>

        <span class="logo" routerLink="/">
          <mat-icon>casino</mat-icon>
          RifApp
        </span>

        <span class="spacer"></span>

        <div class="nav-links" *ngIf="!currentUser">
          <button mat-button routerLink="/auth/login">Iniciar Sesión</button>
          <button mat-raised-button color="accent" routerLink="/auth/register">Registrarse</button>
        </div>

        <div class="user-actions" *ngIf="currentUser">
          <!-- Carrito Button -->
          <button mat-icon-button routerLink="/cart" class="cart-button" [matBadge]="cartItemCount"
                  [matBadgeHidden]="cartItemCount === 0" matBadgeColor="accent">
            <mat-icon>shopping_cart</mat-icon>
          </button>

          <!-- User Menu -->
          <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-button">
            <mat-icon>account_circle</mat-icon>
            {{ currentUser.first_name }}
            <mat-icon>arrow_drop_down</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu">
            <button mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon>
              <span>Mi Perfil</span>
            </button>
            <button mat-menu-item routerLink="/my-tickets">
              <mat-icon>confirmation_number</mat-icon>
              <span>Mis Tickets</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Cerrar Sesión</span>
            </button>
          </mat-menu>
        </div>
      </mat-toolbar-row>
    </mat-toolbar>
  `,
  styles: [`
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .nav-links {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .user-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cart-button {
      margin-right: 8px;
    }

    .user-menu-button {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }
  `]
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  cartItemCount: number = 0;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
    });

    // Subscribirse al cart service para mostrar la cantidad de items
    this.cartService.getCartItemCount().subscribe((count: number) => {
      this.cartItemCount = count;
    });
  }

  toggleSidebar(): void {
    // Implementar toggle del sidebar si se necesita
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error: any) => {
        console.error('Error during logout:', error);
        // Forzar logout local aunque falle el servidor
        this.authService.forceLogout();
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
