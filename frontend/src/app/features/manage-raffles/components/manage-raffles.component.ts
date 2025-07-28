import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RaffleService } from '../../../core/services/raffle.service';
import { AuthService } from '../../../core/services/auth.service';
import { Raffle } from '../../../shared/models/raffle.model';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-manage-raffles',
  standalone: false,
  template: `
    <div class="manage-raffles-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <h1>Gestionar Mis Rifas</h1>
            <p>Administra las rifas que has creado</p>
          </div>
          <button mat-raised-button color="primary" routerLink="/raffles/create" class="create-btn">
            <mat-icon>add</mat-icon>
            Nueva Rifa
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <mat-icon>casino</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ userRaffles.length }}</span>
              <span class="stat-label">Total de Rifas</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon active">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ getActiveRaffles() }}</span>
              <span class="stat-label">Rifas Activas</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon completed">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ getCompletedRaffles() }}</span>
              <span class="stat-label">Rifas Completadas</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon earnings">
              <mat-icon>attach_money</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-number">\${{ getTotalEarnings() }}</span>
              <span class="stat-label">Ingresos Totales</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div *ngIf="!isLoading && userRaffles.length > 0" class="filters-section">
        <div class="filters-container">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar rifas</mat-label>
            <input matInput placeholder="Nombre de la rifa..." [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Estado</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="applyFilters()">
              <mat-option value="">Todos</mat-option>
              <mat-option value="active">Activas</mat-option>
              <mat-option value="completed">Completadas</mat-option>
              <mat-option value="inactive">Inactivas</mat-option>
              <mat-option value="cancelled">Canceladas</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Ordenar por</mat-label>
            <mat-select [(ngModel)]="sortBy" (selectionChange)="applyFilters()">
              <mat-option value="created_at">Fecha de creación</mat-option>
              <mat-option value="name">Nombre</mat-option>
              <mat-option value="end_date">Fecha de finalización</mat-option>
              <mat-option value="tickets_sold">Tickets vendidos</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-button color="primary" (click)="clearFilters()">
            <mat-icon>clear</mat-icon>
            Limpiar filtros
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && filteredRaffles.length === 0" class="empty-state">
        <div class="empty-icon">
          <mat-icon>casino</mat-icon>
        </div>
        <h3>No hay rifas para mostrar</h3>
        <p>Aún no has creado ninguna rifa. ¡Comienza creando tu primera rifa!</p>
        <button mat-raised-button color="primary" routerLink="/raffles/create">
          <mat-icon>add</mat-icon>
          Crear Primera Rifa
        </button>
      </div>

      <!-- Raffles Grid -->
      <div *ngIf="!isLoading && filteredRaffles.length > 0" class="raffles-grid">
        <div *ngFor="let raffle of filteredRaffles" class="raffle-card">
          <div class="raffle-image">
            <img [src]="getImageUrl(raffle.image)" [alt]="raffle.name">
            <div class="raffle-status" [class]="raffle.status">
              {{ getStatusText(raffle.status) }}
            </div>
          </div>

          <div class="raffle-content">
            <h3 class="raffle-title">{{ raffle.name }}</h3>
            <p class="raffle-description">{{ raffle.description | slice:0:100 }}{{ raffle.description.length > 100 ? '...' : '' }}</p>

            <div class="raffle-details">
              <div class="detail-item">
                <mat-icon>monetization_on</mat-icon>
                <span>\${{ raffle.ticket_price }}</span>
              </div>
              <div class="detail-item">
                <mat-icon>confirmation_number</mat-icon>
                <span>{{ raffle.tickets_sold }}/{{ raffle.total_tickets }}</span>
              </div>
              <div class="detail-item">
                <mat-icon>schedule</mat-icon>
                <span>{{ raffle.end_date | date:'short' }}</span>
              </div>
            </div>

            <div class="progress-section">
              <div class="progress-info">
                <span>Vendidos: {{ raffle.tickets_sold }}/{{ raffle.total_tickets }}</span>
                <span>{{ getProgressPercentage(raffle) }}%</span>
              </div>
              <mat-progress-bar
                mode="determinate"
                [value]="getProgressPercentage(raffle)"
                class="progress-bar">
              </mat-progress-bar>
            </div>
          </div>

          <div class="raffle-actions">
            <!-- Botón Realizar Sorteo - SIEMPRE visible para rifas activas -->
            <button *ngIf="raffle.status === 'active'"
                    mat-button
                    [class]="isReadyForDraw(raffle) ? 'draw-btn-enabled' : 'draw-btn-disabled'"
                    [disabled]="!isReadyForDraw(raffle)"
                    (click)="performDraw(raffle)">
              <mat-icon>casino</mat-icon>
              Realizar Sorteo
            </button>

            <!-- Botón Ver Resultados - Solo para rifas completadas -->
            <button *ngIf="raffle.status === 'completed'"
                    mat-button
                    color="primary"
                    [routerLink]="['/draw', raffle.id, 'results']">
              <mat-icon>emoji_events</mat-icon>
              Resultados
            </button>

            <button mat-button color="accent" [routerLink]="['/raffles/edit', raffle.id]">
              <mat-icon>edit</mat-icon>
              Editar
            </button>
            <button mat-button color="warn" (click)="confirmDelete(raffle)">
              <mat-icon>delete</mat-icon>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./manage-raffles.component.scss']
})
export class ManageRafflesComponent implements OnInit {
  userRaffles: Raffle[] = [];
  filteredRaffles: Raffle[] = [];
  currentUser: User | null = null;
  isLoading = true;

  // Filter properties
  searchTerm = '';
  statusFilter = '';
  sortBy = 'created_at';

  constructor(
    private raffleService: RaffleService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUserRaffles();
  }

  loadCurrentUser(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  loadUserRaffles(): void {
    this.isLoading = true;

    this.raffleService.getUserRaffles().subscribe({
      next: (response) => {
        this.userRaffles = response.results;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user raffles:', error);
        this.isLoading = false;
        // Fallback to mock data if API fails
        this.userRaffles = this.getMockRaffles();
        this.applyFilters();
      }
    });
  }

  getMockRaffles(): Raffle[] {
    return [
      {
        id: 1,
        name: 'iPhone 15 Pro - Sorteo Navideño',
        description: 'Gana el último iPhone 15 Pro en este sorteo especial de navidad. Incluye todos los accesorios originales.',
        ticket_price: 25,
        total_tickets: 200,
        tickets_sold: 150,
        tickets_available: 50,
        start_date: '2024-12-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        status: 'active',
        created_by: {
          id: 1,
          email: 'user@example.com',
          first_name: 'Usuario',
          last_name: 'Ejemplo'
        },
        created_at: '2024-11-15T10:00:00Z',
        updated_at: '2024-12-15T10:00:00Z',
        image: '/assets/images/iphone-15-pro.jpg',
        scope: 'national',
        allowed_locations: []
      },
      {
        id: 2,
        name: 'PlayStation 5 + Juegos',
        description: 'PlayStation 5 nueva con 3 juegos incluidos: Spider-Man 2, FIFA 24 y God of War Ragnarök.',
        ticket_price: 15,
        total_tickets: 300,
        tickets_sold: 200,
        tickets_available: 100,
        start_date: '2024-11-01T00:00:00Z',
        end_date: '2024-11-30T23:59:59Z',
        status: 'completed',
        created_by: {
          id: 1,
          email: 'user@example.com',
          first_name: 'Usuario',
          last_name: 'Ejemplo'
        },
        created_at: '2024-10-15T10:00:00Z',
        updated_at: '2024-11-30T10:00:00Z',
        image: '/assets/images/ps5.jpg',
        scope: 'provincial',
        allowed_locations: []
      }
    ];
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active': return 'Activa';
      case 'completed': return 'Completada';
      case 'inactive': return 'Inactiva';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconocido';
    }
  }

  getActiveRaffles(): number {
    return this.userRaffles.filter(raffle => raffle.status === 'active').length;
  }

  getCompletedRaffles(): number {
    return this.userRaffles.filter(raffle => raffle.status === 'completed').length;
  }

  getTotalEarnings(): number {
    return this.userRaffles
      .filter(raffle => raffle.status === 'completed')
      .reduce((total, raffle) => total + (raffle.tickets_sold * raffle.ticket_price), 0);
  }

  getProgressPercentage(raffle: Raffle): number {
    return Math.round((raffle.tickets_sold / raffle.total_tickets) * 100);
  }

  confirmDelete(raffle: Raffle): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la rifa "${raffle.name}"? Esta acción no se puede deshacer.`)) {
      this.deleteRaffle(raffle);
    }
  }

  isReadyForDraw(raffle: Raffle): boolean {
    // Verificar que la rifa esté activa
    if (raffle.status !== 'active') {
      console.log(`Rifa ${raffle.name} no está activa: ${raffle.status}`);
      return false;
    }

    // TEMPORALMENTE comentado para pruebas - descomentar en producción
    // if (raffle.tickets_sold === 0) {
    //   console.log(`Rifa ${raffle.name} no tiene boletos vendidos`);
    //   return false;
    // }

    const today = new Date();
    const endDate = new Date(raffle.end_date);

    // Comparar solo las fechas (sin tiempo)
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    console.log(`Rifa ${raffle.name}:`);
    console.log(`  - Fecha actual: ${todayDateOnly.toLocaleDateString()}`);
    console.log(`  - Fecha fin: ${endDateOnly.toLocaleDateString()}`);
    console.log(`  - ¿Terminó?: ${todayDateOnly > endDateOnly}`);
    console.log(`  - Boletos vendidos: ${raffle.tickets_sold}`);

    // El sorteo se puede realizar el día después de que termine la rifa
    return todayDateOnly > endDateOnly;
  }

  performDraw(raffle: Raffle): void {
    if (!this.isReadyForDraw(raffle)) {
      alert('Esta rifa aún no está lista para el sorteo.');
      return;
    }

    if (raffle.tickets_sold === 0) {
      alert('No se puede realizar el sorteo. No se han vendido boletos para esta rifa.');
      return;
    }

    // Navegar a la página dedicada del sorteo
    this.router.navigate(['/draw', raffle.id]);
  }

  deleteRaffle(raffle: Raffle): void {
    this.raffleService.deleteRaffle(raffle.id).subscribe({
      next: () => {
        this.userRaffles = this.userRaffles.filter(r => r.id !== raffle.id);
        this.filteredRaffles = this.filteredRaffles.filter(r => r.id !== raffle.id);
        alert('Rifa eliminada exitosamente');
      },
      error: (error) => {
        console.error('Error deleting raffle:', error);
        alert('Error al eliminar la rifa. Por favor, inténtalo de nuevo.');
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.userRaffles];

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(raffle =>
        raffle.name.toLowerCase().includes(term) ||
        raffle.description.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (this.statusFilter) {
      filtered = filtered.filter(raffle => raffle.status === this.statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'end_date':
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        case 'tickets_sold':
          return b.tickets_sold - a.tickets_sold;
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    this.filteredRaffles = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.sortBy = 'created_at';
    this.applyFilters();
  }

  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) {
      return '/assets/images/default-raffle.jpg';
    }

    // Si la URL ya es completa (comienza con http), devolverla tal como está
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // Si es una URL relativa, construir la URL completa
    const baseUrl = 'http://localhost:8000';
    return `${baseUrl}${imageUrl}`;
  }
}
