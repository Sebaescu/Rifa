import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RaffleService } from '../../../core/services/raffle.service';
import { StatisticsService } from '../../../core/services/statistics.service';
import { Raffle, UserLocation } from '../../../shared/models/raffle.model';
import { EXAMPLE_RAFFLE_IMAGES } from '../../../../assets/images/raffles/examples/raffle-images.constants';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  localRaffles: Raffle[] = [];
  stateRaffles: Raffle[] = [];
  nationalRaffles: Raffle[] = [];
  internationalRaffles: Raffle[] = [];
  isLoading = true;
  isRefreshingLocation = false;
  userLocation: UserLocation | null = null;
  totalActiveRaffles = 0;
  private subscriptions: Subscription[] = [];

  constructor(
    private raffleService: RaffleService,
    private statisticsService: StatisticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a la ubicación del usuario
    const locationSub = this.raffleService.userLocation$.subscribe(location => {
      this.userLocation = location;
      this.loadRaffles();
    });
    this.subscriptions.push(locationSub);

    // Suscribirse a las estadísticas de StatisticsService
    const statsSub = this.statisticsService.statistics$.subscribe(stats => {
      this.totalActiveRaffles = stats.total_active_raffles;
    });
    this.subscriptions.push(statsSub);

    // Cargar estadísticas iniciales
    this.statisticsService.forceRefresh();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadRaffles(): void {
    this.isLoading = true;
    console.log('DEBUG: Loading raffles with user location:', this.userLocation);

    // Cargar rifas filtradas por ubicación
    this.raffleService.getRafflesNearUser().subscribe({
      next: (response: {count: number, results: Raffle[]}) => {
        console.log('DEBUG: Received raffles from server:', response);
        const raffles = response.results;

        this.organizeRafflesByLocation(raffles);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading raffles:', error);
        this.isLoading = false;
        // Reset arrays on error
        this.localRaffles = [];
        this.stateRaffles = [];
        this.nationalRaffles = [];
        this.internationalRaffles = [];
        this.totalActiveRaffles = 0;
      }
    });

    // Cargar estadísticas generales para obtener el total real de rifas activas
    this.raffleService.getRaffleStatistics().subscribe({
      next: (stats) => {
        console.log('DEBUG: Received statistics:', stats);
        this.totalActiveRaffles = stats.total_active_raffles;
      },
      error: (error: any) => {
        console.error('Error loading statistics:', error);
        // Fallback: mantener el contador local si falla
      }
    });
  }

  private organizeRafflesByLocation(raffles: Raffle[]): void {
    const activeRaffles = raffles.filter(r => r.status === 'active');
    console.log('DEBUG: Organizing raffles by location:', {
      totalRaffles: raffles.length,
      activeRaffles: activeRaffles.length,
      userLocation: this.userLocation
    });

    // Reset arrays
    this.localRaffles = [];
    this.stateRaffles = [];
    this.nationalRaffles = [];
    this.internationalRaffles = [];

    activeRaffles.forEach(raffle => {
      console.log(`DEBUG: Processing raffle "${raffle.name}" with scope: ${raffle.scope}`);

      switch(raffle.scope) {
        case 'provincial':
          this.stateRaffles.push(raffle);
          break;
        case 'national':
          this.nationalRaffles.push(raffle);
          break;
        case 'international':
          this.internationalRaffles.push(raffle);
          break;
        default:
          console.warn(`Unknown scope: ${raffle.scope} for raffle: ${raffle.name}`);
      }
    });

    // Sort by distance if available, otherwise by creation date
    this.stateRaffles.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    this.nationalRaffles.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    this.internationalRaffles.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

    console.log('DEBUG: Raffles organized:', {
      provincial: this.stateRaffles.length,
      national: this.nationalRaffles.length,
      international: this.internationalRaffles.length
    });
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

  getScopeTitle(scope: string): string {
    const titles = {
      'local': this.userLocation?.city ? `Rifas en ${this.userLocation.city}` : 'Rifas Locales',
      'state': this.userLocation?.state ? `Rifas en ${this.userLocation.state}` : 'Rifas Provinciales',
      'national': this.userLocation?.country ? `Rifas en ${this.userLocation.country}` : 'Rifas Nacionales',
      'international': 'Rifas Internacionales'
    };
    return titles[scope as keyof typeof titles] || 'Rifas';
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

  navigateToScope(scope: string): void {
    this.router.navigate(['/raffles'], {
      queryParams: { scope: scope }
    });
  }

  private getExampleRaffles(): Raffle[] {
    return [
      // Rifas locales
      {
        id: 1,
        name: 'iPhone 15 Pro',
        description: 'Gana el último iPhone 15 Pro con 256GB de almacenamiento y cámara profesional',
        ticket_price: 50,
        total_tickets: 100,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        status: 'active',
        created_by: { id: 1, email: 'admin@rifapp.com', first_name: 'Admin', last_name: 'RifApp' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        image: EXAMPLE_RAFFLE_IMAGES.iphone15,
        tickets_available: 75,
        tickets_sold: 25,
        scope: 'provincial',
        allowed_locations: [],
        distance_km: 2.5
      },
      {
        id: 2,
        name: 'Chevrolet Spark',
        description: 'Automóvil Chevrolet Spark 2024, perfecto para la ciudad',
        ticket_price: 200,
        total_tickets: 500,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        status: 'active',
        created_by: { id: 1, email: 'admin@rifapp.com', first_name: 'Admin', last_name: 'RifApp' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        image: EXAMPLE_RAFFLE_IMAGES.spark,
        tickets_available: 320,
        tickets_sold: 180,
        scope: 'provincial',
        allowed_locations: [],
        distance_km: 5.2
      },
      // Rifas nacionales
      {
        id: 3,
        name: 'Samsung TV 65"',
        description: 'Smart TV Samsung 65 pulgadas 4K con tecnología QLED',
        ticket_price: 75,
        total_tickets: 200,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        status: 'active',
        created_by: { id: 1, email: 'admin@rifapp.com', first_name: 'Admin', last_name: 'RifApp' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        image: EXAMPLE_RAFFLE_IMAGES.samsungTV,
        tickets_available: 150,
        tickets_sold: 50,
        scope: 'national',
        allowed_locations: []
      },
      {
        id: 4,
        name: 'Laptop Gaming ROG',
        description: 'Laptop gaming ASUS ROG con RTX 4060 y procesador Intel i7',
        ticket_price: 100,
        total_tickets: 300,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        status: 'active',
        created_by: { id: 1, email: 'admin@rifapp.com', first_name: 'Admin', last_name: 'RifApp' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        image: EXAMPLE_RAFFLE_IMAGES.g14,
        tickets_available: 200,
        tickets_sold: 100,
        scope: 'national',
        allowed_locations: []
      },
      // Rifas internacionales
      {
        id: 5,
        name: 'Viaje a Disney World',
        description: 'Viaje todo incluido para 4 personas a Disney World Orlando por 7 días',
        ticket_price: 150,
        total_tickets: 1000,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        status: 'active',
        created_by: { id: 1, email: 'admin@rifapp.com', first_name: 'Admin', last_name: 'RifApp' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        image: EXAMPLE_RAFFLE_IMAGES.disneyWorld,
        tickets_available: 750,
        tickets_sold: 250,
        scope: 'international',
        allowed_locations: []
      },
      {
        id: 6,
        name: 'Yamaha MT-03',
        description: 'Motocicleta Yamaha MT-03 2024, perfecta para principiantes y expertos',
        ticket_price: 250,
        total_tickets: 400,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        status: 'active',
        created_by: { id: 1, email: 'admin@rifapp.com', first_name: 'Admin', last_name: 'RifApp' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        image: EXAMPLE_RAFFLE_IMAGES.mt03,
        tickets_available: 300,
        tickets_sold: 100,
        scope: 'international',
        allowed_locations: []
      }
    ];
  }

  refreshLocation(): void {
    console.log('Dashboard: Refreshing user location...');
    this.isRefreshingLocation = true;

    // Forzar la detección de ubicación nuevamente
    this.raffleService.forceLocationRefresh();

    // Simular que termina después de un tiempo mínimo para mostrar la animación
    setTimeout(() => {
      this.isRefreshingLocation = false;
    }, 2000);
  }
}
