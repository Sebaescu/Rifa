import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RaffleService } from '../../../core/services/raffle.service';
import { Raffle, UserLocation } from '../../../shared/models/raffle.model';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  localRaffles: Raffle[] = [];
  stateRaffles: Raffle[] = [];
  nationalRaffles: Raffle[] = [];
  internationalRaffles: Raffle[] = [];
  isLoading = true;
  userLocation: UserLocation | null = null;
  totalActiveRaffles = 0;

  constructor(
    private raffleService: RaffleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a la ubicación del usuario
    this.raffleService.userLocation$.subscribe(location => {
      this.userLocation = location;
      this.loadRaffles();
    });
  }

  loadRaffles(): void {
    this.isLoading = true;
    this.raffleService.getRafflesNearUser().subscribe({
      next: (response: {count: number, results: Raffle[]}) => {
        this.organizeRafflesByLocation(response.results);
        this.totalActiveRaffles = response.results.filter(r => r.status === 'active').length;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading raffles:', error);
        this.isLoading = false;
      }
    });
  }

  private organizeRafflesByLocation(raffles: Raffle[]): void {
    const activeRaffles = raffles.filter(r => r.status === 'active');

    this.localRaffles = activeRaffles.filter(r => r.scope === 'local')
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

    this.stateRaffles = activeRaffles.filter(r => r.scope === 'state')
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

    this.nationalRaffles = activeRaffles.filter(r => r.scope === 'national')
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

    this.internationalRaffles = activeRaffles.filter(r => r.scope === 'international')
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
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

  navigateToScope(scope: string): void {
    this.router.navigate(['/raffles'], {
      queryParams: { scope: scope }
    });
  }
}
