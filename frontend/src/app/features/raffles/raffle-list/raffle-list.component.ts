import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RaffleService } from '../../../core/services/raffle.service';
import { Raffle } from '../../../shared/models/raffle.model';

@Component({
  selector: 'app-raffle-list',
  standalone: false,
  template: `
    <div class="container">
      <div class="header">
        <h1>{{ getPageTitle() }}</h1>
        <p class="subtitle" *ngIf="currentScope">
          {{ getScopeDescription() }}
        </p>
      </div>

      <!-- Search Section -->
      <div class="search-section" *ngIf="!isLoading">
        <div class="search-container">
          <div class="search-wrapper">
            <div class="search-input-wrapper">
              <mat-icon class="search-icon">search</mat-icon>
              <input
                type="text"
                placeholder="Buscar rifas por nombre o descripción..."
                [(ngModel)]="searchQuery"
                (input)="onSearchInput()"
                class="search-input"
              />
              <button
                mat-icon-button
                *ngIf="searchQuery"
                (click)="clearSearch()"
                class="clear-search-btn"
                matTooltip="Limpiar búsqueda">
                <mat-icon>clear</mat-icon>
              </button>
            </div>
          </div>
          <div *ngIf="searchQuery && searchQuery.length >= 2" class="search-status">
            <small>Mostrando {{ filteredRaffles.length }} rifas que contienen "{{ searchQuery }}"</small>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Cargando rifas...</p>
      </div>

      <!-- No Results -->
      <div *ngIf="!isLoading && filteredRaffles.length === 0 && searchQuery" class="no-results">
        <mat-icon>search_off</mat-icon>
        <h3>No se encontraron rifas</h3>
        <p>No se encontraron rifas que coincidan con "{{ searchQuery }}". Intenta con otros términos de búsqueda.</p>
      </div>

      <!-- No Results (general) -->
      <div *ngIf="!isLoading && raffles.length === 0 && !searchQuery" class="no-results">
        <mat-icon>search_off</mat-icon>
        <h3>No se encontraron rifas</h3>
        <p>{{ getNoResultsMessage() }}</p>
      </div>

      <!-- Raffles Grid -->
      <div *ngIf="!isLoading && filteredRaffles.length > 0" class="raffles-grid">
        <mat-card class="raffle-card" *ngFor="let raffle of filteredRaffles">
          <div class="card-content" (click)="viewRaffleDetails(raffle.id)">
            <div class="card-image" *ngIf="raffle.image">
              <img [src]="raffle.image" [alt]="raffle.name">
            </div>
            <mat-card-header>
              <mat-card-title>{{ raffle.name }}</mat-card-title>
              <mat-card-subtitle>
                <div class="distance" *ngIf="raffle.distance_km">
                  <mat-icon>location_on</mat-icon>
                  {{ formatDistance(raffle.distance_km) }}
                </div>
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="description">{{ raffle.description | slice:0:100 }}...</p>
              <div class="raffle-info">
                <div class="price">
                  <span class="label">Precio:</span>
                  <span class="value">\${{ raffle.ticket_price }}</span>
                </div>
                <div class="tickets">
                  <span class="label">Disponibles:</span>
                  <span class="value">{{ raffle.tickets_available }}</span>
                </div>
              </div>
            </mat-card-content>
          </div>
          <div class="card-actions">
            <button mat-fab
                    color="primary"
                    class="add-to-cart-btn"
                    (click)="addToCart(raffle, $event)"
                    [disabled]="raffle.tickets_available <= 0"
                    [title]="raffle.tickets_available === 0 ? 'Sin boletos disponibles' : 'Añadir al carrito'">
              <mat-icon>add_shopping_cart</mat-icon>
            </button>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 32px;
    }

    .header h1 {
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 2.5rem;
      font-weight: 600;
    }

    .subtitle {
      color: #666;
      font-size: 18px;
      margin: 0 0 8px 0;
    }

    .search-info {
      color: #1976d2;
      font-size: 16px;
      font-weight: 500;
      margin: 0;
    }

    .loading {
      text-align: center;
      padding: 80px;
    }

    .loading p {
      margin-top: 16px;
      color: #666;
      font-size: 18px;
    }

    .no-results {
      text-align: center;
      padding: 80px;
      color: #666;
    }

    .no-results mat-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #ddd;
      margin-bottom: 16px;
    }

    .no-results h3 {
      margin: 0 0 8px 0;
      font-size: 24px;
    }

    .raffles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }

    .raffle-card {
      cursor: default;
      transition: all 0.3s ease;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .card-content {
      cursor: pointer;
      flex: 1;
    }

    .card-content:hover ~ .card-actions .add-to-cart-btn,
    .card-actions:hover .add-to-cart-btn {
      opacity: 1;
      transform: scale(1);
    }

    .card-actions {
      position: absolute;
      bottom: 16px;
      right: 16px;
      z-index: 2;
    }

    .add-to-cart-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
      opacity: 0.9;
      transform: scale(0.9);
    }

    .add-to-cart-btn:hover {
      transform: scale(1.1) !important;
      box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4) !important;
    }

    .add-to-cart-btn:disabled {
      background: #ccc !important;
      color: #999 !important;
      box-shadow: none !important;
      cursor: not-allowed !important;
      opacity: 0.5 !important;
    }

    .raffle-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      border-color: #1976d2;
    }

    .card-image {
      height: 180px;
      overflow: hidden;
      position: relative;
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .raffle-card:hover .card-image img {
      transform: scale(1.05);
    }

    .raffle-card mat-card-header {
      padding: 16px 16px 8px 16px;
    }

    .raffle-card mat-card-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      line-height: 1.3;
    }

    .distance {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #666;
      font-size: 14px;
    }

    .distance mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #ff5722;
    }

    .raffle-card mat-card-content {
      padding: 8px 16px 16px 16px;
    }

    .description {
      color: #666;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .raffle-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }

    .raffle-info > div {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .value {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .price .value {
      color: #4caf50;
    }

    .tickets .value {
      color: #2196f3;
    }

    /* Search Section Styles */
    .search-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    }

    .search-title {
      color: white;
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 8px;
      text-align: center;
      padding-bottom: 4px;
      line-height: 1.3;
    }

    .search-subtitle {
      color: rgba(255, 255, 255, 0.9);
      text-align: center;
      margin-bottom: 24px;
      font-size: 1rem;
    }

    .search-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 800px;
      margin: 0 auto;
    }

    .search-wrapper {
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: center;
    }

    .search-input-wrapper {
      position: relative;
      flex: 1;
      min-width: 300px;
      max-width: 500px;
      display: flex;
      align-items: center;
      background: transparent;
      border-radius: 50px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      padding: 0 20px;
      transition: all 0.3s ease;
    }

    .search-input-wrapper:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.4);
    }

    .search-input-wrapper:focus-within {
      background: rgba(255, 255, 255, 0.1);
      border-color: #667eea;
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
    }

    .search-icon {
      color: rgba(255, 255, 255, 0.8);
      margin-right: 12px;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      color: white;
      font-size: 16px;
      padding: 16px 0;
      outline: none;
    }

    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .clear-search-btn {
      color: rgba(255, 255, 255, 0.7);
      transition: color 0.3s ease;
    }

    .clear-search-btn:hover {
      color: white;
    }

    .search-status {
      margin-top: 16px;
      color: rgba(255, 255, 255, 0.7);
      font-style: italic;
      text-align: center;
    }

    @media (max-width: 768px) {
      .search-section {
        padding: 24px;
        margin-bottom: 24px;
      }

      .search-title {
        font-size: 1.3rem;
      }

      .search-wrapper {
        flex-direction: column;
        gap: 16px;
      }

      .search-input-wrapper {
        min-width: unset;
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .container {
        padding: 16px;
      }

      .header h1 {
        font-size: 2rem;
      }

      .raffles-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  `]
})
export class RaffleListComponent implements OnInit, OnDestroy {
  raffles: Raffle[] = [];
  filteredRaffles: Raffle[] = [];
  isLoading = true;
  searchQuery: string = '';
  currentScope: string = '';

  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private raffleService: RaffleService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Configurar lazy loading para búsqueda
    const searchSub = this.searchSubject.pipe(
      debounceTime(300), // Esperar 300ms después de que el usuario deje de escribir
      distinctUntilChanged() // Solo procesar si el valor cambió
    ).subscribe(searchTerm => {
      this.filterRaffles(searchTerm);
    });
    this.subscriptions.push(searchSub);

    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      this.currentScope = params['scope'] || '';
      this.loadRaffles();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadRaffles(): void {
    this.isLoading = true;

    if (this.searchQuery) {
      this.searchRaffles();
    } else if (this.currentScope) {
      this.loadRafflesByScope();
    } else {
      this.loadAllRaffles();
    }
  }

  private searchRaffles(): void {
    // No necesitamos este método ya que usamos lazy loading
    // La búsqueda se maneja a través de searchQuery y filteredRaffles
    this.loadAllRaffles();
  }

  private loadRafflesByScope(): void {
    this.raffleService.getRafflesNearUser().subscribe({
      next: (response: {count: number, results: Raffle[]}) => {
        this.raffles = response.results.filter(raffle =>
          raffle.scope === this.currentScope && raffle.status === 'active'
        );
        this.filteredRaffles = [...this.raffles]; // Inicializar filteredRaffles
        this.isLoading = false;

        // Aplicar filtro si hay un searchQuery inicial
        if (this.searchQuery) {
          this.filterRaffles(this.searchQuery);
        }
      },
      error: (error: any) => {
        console.error('Error loading raffles by scope:', error);
        this.isLoading = false;
      }
    });
  }

  private loadAllRaffles(): void {
    this.raffleService.getRafflesNearUser().subscribe({
      next: (response: {count: number, results: Raffle[]}) => {
        this.raffles = response.results.filter(raffle => raffle.status === 'active');
        this.filteredRaffles = [...this.raffles]; // Inicializar filteredRaffles
        this.isLoading = false;

        // Aplicar filtro si hay un searchQuery inicial
        if (this.searchQuery) {
          this.filterRaffles(this.searchQuery);
        }
      },
      error: (error: any) => {
        console.error('Error loading raffles:', error);
        this.isLoading = false;
      }
    });
  }

  getPageTitle(): string {
    if (this.searchQuery) {
      return 'Buscar Rifas';
    }

    if (this.currentScope) {
      const titles = {
        'local': 'Rifas en tu Ciudad',
        'national': 'Rifas Nacionales',
        'international': 'Rifas Internacionales'
      };
      return titles[this.currentScope as keyof typeof titles] || 'Rifas';
    }

    return 'Todas las Rifas';
  }

  getScopeDescription(): string {
    const descriptions = {
      'local': 'Rifas disponibles en tu área local',
      'national': 'Rifas disponibles a nivel nacional',
      'international': 'Rifas disponibles internacionalmente'
    };
    return descriptions[this.currentScope as keyof typeof descriptions] || '';
  }

  getNoResultsMessage(): string {
    if (this.searchQuery) {
      return `No se encontraron rifas que coincidan con "${this.searchQuery}". Intenta con otros términos de búsqueda.`;
    }

    if (this.currentScope) {
      const messages = {
        'local': 'No hay rifas disponibles en tu área local en este momento.',
        'national': 'No hay rifas nacionales disponibles en este momento.',
        'international': 'No hay rifas internacionales disponibles en este momento.'
      };
      return messages[this.currentScope as keyof typeof messages] || 'No hay rifas disponibles.';
    }

    return 'No hay rifas disponibles en este momento.';
  }

  viewRaffleDetails(raffleId: number): void {
    this.router.navigate(['/raffles', raffleId]);
  }

  formatDistance(distance?: number): string {
    if (!distance) return '';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  }

  addToCart(raffle: Raffle, event: Event): void {
    // Prevenir que el click propague al card y abra los detalles
    event.stopPropagation();

    // Verificar que la rifa tenga boletos disponibles
    if (raffle.tickets_available === 0) {
      this.showMessage('No hay boletos disponibles para esta rifa');
      return;
    }

    console.log('Navegando a selección de tickets para:', raffle.name, 'ID:', raffle.id);

    // Navegar a la página de selección de tickets
    this.router.navigate(['/raffles', raffle.id, 'tickets']);
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next('');
  }

  private filterRaffles(searchTerm: string): void {
    if (!searchTerm || searchTerm.length < 2) {
      // Restaurar todas las rifas originales
      this.filteredRaffles = [...this.raffles];
      return;
    }

    const term = searchTerm.toLowerCase().trim();

    // Filtrar rifas basado en el término de búsqueda
    this.filteredRaffles = this.raffles.filter(raffle =>
      raffle.name.toLowerCase().includes(term) ||
      raffle.description.toLowerCase().includes(term)
    );

    console.log('DEBUG: Filtered raffles:', {
      searchTerm: term,
      originalCount: this.raffles.length,
      filteredCount: this.filteredRaffles.length
    });
  }
}
