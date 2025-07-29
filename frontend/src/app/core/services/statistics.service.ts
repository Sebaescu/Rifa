import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface RaffleStatistics {
  total_active_raffles: number;
  total_raffles: number;
  total_tickets_sold: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private readonly API_URL = environment.apiUrl;
  private statisticsSubject = new BehaviorSubject<RaffleStatistics>({
    total_active_raffles: 0,
    total_raffles: 0,
    total_tickets_sold: 0
  });

  public statistics$ = this.statisticsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Método para obtener estadísticas del servidor y actualizar el subject
  refreshStatistics(): Observable<RaffleStatistics> {
    return new Observable(observer => {
      this.http.get<RaffleStatistics>(`${this.API_URL}/statistics/`).subscribe({
        next: (stats) => {
          console.log('StatisticsService: Updated statistics:', stats);
          this.statisticsSubject.next(stats);
          observer.next(stats);
          observer.complete();
        },
        error: (error) => {
          console.error('StatisticsService: Error loading statistics:', error);
          observer.error(error);
        }
      });
    });
  }

  // Método para obtener las estadísticas actuales sin hacer llamada HTTP
  getCurrentStatistics(): RaffleStatistics {
    return this.statisticsSubject.value;
  }

  // Método para forzar una actualización (llamar después de crear rifas)
  forceRefresh(): void {
    this.refreshStatistics().subscribe();
  }
}
