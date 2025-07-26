import { Component, OnInit } from '@angular/core';
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
            <img [src]="raffle.image || '/assets/images/default-raffle.jpg'" [alt]="raffle.name">
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
            <button mat-button color="primary" [routerLink]="['/rifas', raffle.id]">
              <mat-icon>visibility</mat-icon>
              Ver
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

  constructor(
    private raffleService: RaffleService,
    private authService: AuthService
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
    
    setTimeout(() => {
      this.userRaffles = this.getMockRaffles();
      this.filteredRaffles = [...this.userRaffles];
      this.isLoading = false;
    }, 1000);
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
        scope: 'state',
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

  deleteRaffle(raffle: Raffle): void {
    console.log('Eliminando rifa:', raffle.name);
    this.userRaffles = this.userRaffles.filter(r => r.id !== raffle.id);
    this.filteredRaffles = this.filteredRaffles.filter(r => r.id !== raffle.id);
    alert('Rifa eliminada exitosamente');
  }
}
