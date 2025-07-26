import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { RaffleService } from '../../../core/services/raffle.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: false,
  template: `
    <nav class="modern-navbar">
      <div class="navbar-container">
        <!-- Navbar para rutas de auth (login/register) -->
        <div *ngIf="isAuthRoute" class="auth-navbar">
          <div class="auth-logo-center">
            <button mat-button routerLink="/" class="logo-btn-auth">
              <mat-icon>casino</mat-icon>
              <span class="logo-text">RifApp</span>
            </button>
          </div>
          <div class="auth-buttons">
            <button mat-button routerLink="/auth/login" routerLinkActive="active" class="auth-btn">
              Iniciar Sesión
            </button>
            <button mat-button routerLink="/auth/register" routerLinkActive="active" class="auth-btn register">
              Registrarse
            </button>
          </div>
        </div>

        <!-- Navbar para rutas normales (dashboard, etc.) -->
        <div *ngIf="!isAuthRoute" class="main-navbar">
          <div class="navbar-left">
            <!-- Mobile menu button -->
            <button mat-icon-button class="mobile-menu-btn" (click)="toggleMobileMenu()">
              <mat-icon>menu</mat-icon>
            </button>

            <!-- Logo -->
            <button mat-button routerLink="/" class="logo-btn">
              <mat-icon>casino</mat-icon>
              <span class="logo-text">RifApp</span>
            </button>
          </div>

          <div class="navbar-center">
            <!-- Search bar -->
            <div class="search-container">
              <div class="search-wrapper">
                <mat-icon class="search-icon">search</mat-icon>
                <input
                  type="text"
                  placeholder="Buscar rifas..."
                  [(ngModel)]="searchQuery"
                  (keyup.enter)="onSearch()"
                  class="search-input"
                />
              </div>
            </div>
          </div>

          <div class="navbar-right">
            <!-- Rifas Badge -->
            <div class="rifas-badge-container">
              <button mat-button class="rifas-badge" routerLink="/rifas">
                <mat-icon>stars</mat-icon>
                <div class="badge-content">
                  <span class="badge-number">{{ activeRafflesCount }}</span>
                  <span class="badge-label">Rifas Activas</span>
                </div>
              </button>
            </div>

            <!-- Cart button -->
            <button mat-icon-button routerLink="/cart" class="cart-button"
                    [matBadge]="cartItemCount"
                    [matBadgeHidden]="cartItemCount === 0" matBadgeColor="accent">
              <mat-icon>shopping_cart</mat-icon>
            </button>

            <!-- User menu -->
            <div *ngIf="currentUser" class="user-menu-container">
              <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-trigger">
                <div class="user-info">
                  <mat-icon>account_circle</mat-icon>
                  <span class="user-name">{{ currentUser.first_name }}</span>
                  <mat-icon class="dropdown-icon">keyboard_arrow_down</mat-icon>
                </div>
              </button>
              <mat-menu #userMenu="matMenu" class="user-dropdown">
                <button mat-menu-item routerLink="/profile">
                  <mat-icon>person</mat-icon>
                  <span>Mi Perfil</span>
                </button>
                <button mat-menu-item routerLink="/mis-rifas">
                  <mat-icon>confirmation_number</mat-icon>
                  <span>Mis Rifas</span>
                </button>
                <button mat-menu-item routerLink="/gestionar-rifas">
                  <mat-icon>settings</mat-icon>
                  <span>Gestionar Rifas</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="logout()" class="logout-btn">
                  <mat-icon>logout</mat-icon>
                  <span>Cerrar Sesión</span>
                </button>
              </mat-menu>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Mobile Burger Menu -->
    <div class="mobile-menu-overlay"
         *ngIf="!isAuthRoute && isMobileMenuOpen"
         (click)="toggleMobileMenu()">
    </div>

    <div class="mobile-menu"
         *ngIf="!isAuthRoute"
         [class.open]="isMobileMenuOpen">
      <div class="mobile-menu-header">
        <div class="mobile-logo">
          <mat-icon>casino</mat-icon>
          <span>RifApp</span>
        </div>
        <button mat-icon-button (click)="toggleMobileMenu()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="mobile-menu-content">
        <nav class="mobile-nav">
          <a mat-button
             routerLink="/rifas"
             routerLinkActive="active"
             (click)="toggleMobileMenu()"
             class="mobile-nav-item">
            <mat-icon>explore</mat-icon>
            <span>Explorar Rifas</span>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </a>

          <a mat-button
             routerLink="/raffles/create"
             routerLinkActive="active"
             (click)="toggleMobileMenu()"
             class="mobile-nav-item">
            <mat-icon>add_circle_outline</mat-icon>
            <span>Crear Rifa</span>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </a>

          <div class="mobile-nav-divider"></div>

          <a mat-button
             routerLink="/profile"
             routerLinkActive="active"
             (click)="toggleMobileMenu()"
             class="mobile-nav-item"
             *ngIf="currentUser">
            <mat-icon>person</mat-icon>
            <span>Mi Perfil</span>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </a>

          <a mat-button
             routerLink="/mis-rifas"
             routerLinkActive="active"
             (click)="toggleMobileMenu()"
             class="mobile-nav-item"
             *ngIf="currentUser">
            <mat-icon>confirmation_number</mat-icon>
            <span>Mis Rifas</span>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </a>

          <a mat-button
             routerLink="/gestionar-rifas"
             routerLinkActive="active"
             (click)="toggleMobileMenu()"
             class="mobile-nav-item"
             *ngIf="currentUser">
            <mat-icon>settings</mat-icon>
            <span>Gestionar Rifas</span>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </a>
        </nav>

        <div class="mobile-menu-footer" *ngIf="currentUser">
          <button mat-button (click)="logout()" class="logout-mobile-btn">
            <mat-icon>logout</mat-icon>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modern-navbar {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      position: sticky;
      top: 0;
      z-index: 1000;
      height: 64px;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    }

    .navbar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      height: 100%;
    }

    .navbar-left {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .navbar-center-logo {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .mobile-menu-btn {
      color: white !important;
    }

    .logo-btn {
      color: white !important;
      font-size: 1.2rem !important;
      font-weight: 600 !important;
      padding: 0.5rem 1rem !important;
      border-radius: 12px !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      gap: 0.5rem !important;
    }

    .logo-btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4) !important;
    }

    .logo-text {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: 700;
    }

    .navbar-right {
      flex: 1;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 1rem;
    }

    .search-container {
      margin-right: 1rem;
    }

    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 25px;
      padding: 0.5rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
      min-width: 200px;
    }

    .search-wrapper:focus-within {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.4);
      box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);
    }

    .search-icon {
      color: rgba(255, 255, 255, 0.7);
      margin-right: 0.5rem;
    }

    .search-input {
      background: none;
      border: none;
      outline: none;
      color: white;
      font-size: 0.9rem;
      width: 100%;
    }

    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .rifas-badge-container {
      margin-right: 1rem;
    }

    .rifas-badge {
      background: linear-gradient(135deg, #ff6b6b, #ee5a24) !important;
      color: white !important;
      border-radius: 15px !important;
      padding: 0.5rem 1rem !important;
      box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3) !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      gap: 0.5rem !important;
      position: relative !important;
      overflow: hidden !important;
    }

    .rifas-badge::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }

    .rifas-badge:hover::before {
      left: 100%;
    }

    .rifas-badge:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 25px rgba(255, 107, 107, 0.4) !important;
    }

    .badge-content {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .badge-number {
      font-size: 1.2rem;
      font-weight: 700;
      line-height: 1;
    }

    .badge-label {
      font-size: 0.7rem;
      opacity: 0.9;
      line-height: 1;
    }

    .cart-button {
      color: white !important;
      position: relative;
    }

    .user-menu-container {
      display: flex;
      align-items: center;
    }

    .user-menu-trigger {
      color: white !important;
      background: rgba(255, 255, 255, 0.1) !important;
      border-radius: 10px !important;
      padding: 0.5rem 1rem !important;
      transition: all 0.3s ease !important;
    }

    .user-menu-trigger:hover {
      background: rgba(255, 255, 255, 0.2) !important;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-name {
      font-weight: 500;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dropdown-icon {
      font-size: 1rem !important;
      transition: transform 0.3s ease;
    }

    .user-dropdown {
      margin-top: 0.5rem;
      border-radius: 10px !important;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2) !important;
    }

    .logout-btn {
      color: #f44336 !important;
    }

    /* Auth buttons */
    .auth-buttons {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .auth-btn {
      color: white !important;
      font-weight: 500 !important;
      border-radius: 8px !important;
      padding: 0.5rem 1.5rem !important;
      transition: all 0.3s ease !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
    }

    .auth-btn:hover {
      background: rgba(255, 255, 255, 0.1) !important;
    }

    .auth-btn.register {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      border: none !important;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
    }

    .auth-btn.register:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4) !important;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .navbar-center {
        display: none;
      }

      .rifas-badge .badge-label {
        display: none;
      }

      .user-name {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .navbar-container {
        padding: 0 0.5rem;
      }

      .navbar-right {
        gap: 0.5rem;
      }

      .rifas-badge {
        padding: 0.25rem 0.5rem !important;
      }

      .badge-number {
        font-size: 1rem;
      }
    }

    /* Estilos para navbar de auth */
    .auth-navbar {
      display: flex;
      align-items: center;
      width: 100%;
      position: relative;
    }

    .auth-logo-center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      justify-content: center;
    }

    .auth-buttons {
      margin-left: auto;
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .logo-btn-auth {
      color: white !important;
      font-size: 1.2rem !important;
      font-weight: 600 !important;
      padding: 0.5rem 1rem !important;
      border-radius: 12px !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      gap: 0.5rem !important;
    }

    .logo-btn-auth:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4) !important;
    }

    .auth-btn {
      color: white !important;
      font-weight: 500 !important;
      border-radius: 8px !important;
      padding: 0.5rem 1.5rem !important;
      transition: all 0.3s ease !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
    }

    .auth-btn:hover {
      background: rgba(255, 255, 255, 0.1) !important;
    }

    .auth-btn.register {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      border: none !important;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
    }

    .auth-btn.register:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4) !important;
    }

    /* Estilos para navbar principal */
    .main-navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .navbar-center {
      flex: 1;
      display: flex;
      justify-content: center;
      max-width: 400px;
      margin: 0 2rem;
    }

    /* Mobile responsiveness para auth */
    @media (max-width: 768px) {
      .auth-buttons {
        gap: 0.5rem;
      }

      .auth-btn {
        padding: 0.4rem 1rem !important;
        font-size: 0.9rem !important;
      }
    }

    /* Mobile Menu Styles */
    .mobile-menu-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1001;
      backdrop-filter: blur(2px);
    }

    .mobile-menu {
      position: fixed;
      top: 0;
      left: -100%;
      width: 280px;
      height: 100vh;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
      z-index: 1002;
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow-y: auto;
    }

    .mobile-menu.open {
      left: 0;
    }

    .mobile-menu-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .mobile-logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .close-btn {
      color: white !important;
    }

    .mobile-menu-content {
      padding: 1rem 0;
      height: calc(100vh - 80px);
      display: flex;
      flex-direction: column;
    }

    .mobile-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0 1rem;
    }

    .mobile-nav-item {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      width: 100% !important;
      padding: 1rem !important;
      margin: 0 !important;
      color: rgba(255, 255, 255, 0.8) !important;
      background: transparent !important;
      border-radius: 12px !important;
      transition: all 0.3s ease !important;
      font-weight: 500 !important;
      text-decoration: none !important;
      border: none !important;
    }

    .mobile-nav-item:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: white !important;
      transform: translateX(8px) !important;
    }

    .mobile-nav-item.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
    }

    .mobile-nav-item .arrow {
      opacity: 0.6;
      transition: transform 0.3s ease;
    }

    .mobile-nav-item:hover .arrow {
      transform: translateX(4px);
    }

    .mobile-nav-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 1rem 0;
    }

    .mobile-menu-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logout-mobile-btn {
      display: flex !important;
      align-items: center !important;
      gap: 0.5rem !important;
      width: 100% !important;
      padding: 1rem !important;
      color: #ff6b6b !important;
      background: rgba(255, 107, 107, 0.1) !important;
      border-radius: 12px !important;
      transition: all 0.3s ease !important;
      font-weight: 500 !important;
    }

    .logout-mobile-btn:hover {
      background: rgba(255, 107, 107, 0.2) !important;
      transform: translateY(-2px) !important;
    }
  `]
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  cartItemCount = 0;
  activeRafflesCount = 0;
  searchQuery = '';
  isMobile = false;
  isAuthRoute = false;
  isMobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cartService: CartService,
    private raffleService: RaffleService
  ) {}

  ngOnInit() {
    this.checkMobile();
    this.loadUserData();
    this.loadCartCount();
    this.loadActiveRafflesCount();
    this.checkAuthRoute();

    // Listen to window resize
    window.addEventListener('resize', () => this.checkMobile());

    // Listen to router events to detect auth routes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkAuthRoute();
        // Close mobile menu when route changes
        if (this.isMobileMenuOpen) {
          this.isMobileMenuOpen = false;
          document.body.style.overflow = 'auto';
        }
      });
  }

  private checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  private checkAuthRoute() {
    this.isAuthRoute = this.router.url.startsWith('/auth');
  }

  private loadUserData() {
    this.currentUser = this.authService.getCurrentUser();
  }

  private loadCartCount() {
    // Mock data for now - replace with actual cart service call
    this.cartItemCount = 3;
  }

  private loadActiveRafflesCount() {
    // Mock data for now - replace with actual raffle service call
    this.activeRafflesCount = 12;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Prevent body scroll when menu is open
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/rifas'], {
        queryParams: { search: this.searchQuery.trim() }
      });
    }
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
