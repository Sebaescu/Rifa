import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, BehaviorSubject } from 'rxjs';
import { Raffle, RaffleDetail, CreateRaffleRequest, Ticket, Location, UserLocation } from '../../shared/models/raffle.model';

@Injectable({
  providedIn: 'root'
})
export class RaffleService {
  private readonly API_URL = 'http://localhost:8000/api';
  private userLocationSubject = new BehaviorSubject<UserLocation | null>(null);
  public userLocation$ = this.userLocationSubject.asObservable();

  constructor(private http: HttpClient) {
    this.detectUserLocation();
  }

  getRaffles(search?: string, userLat?: number, userLng?: number): Observable<{count: number, results: Raffle[]}> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    if (userLat && userLng) {
      params = params.set('user_lat', userLat.toString());
      params = params.set('user_lng', userLng.toString());
    }
    return this.http.get<{count: number, results: Raffle[]}>(`${this.API_URL}/raffles/`, { params });
  }

  getRafflesNearUser(): Observable<{count: number, results: Raffle[]}> {
    const userLocation = this.userLocationSubject.value;
    if (userLocation?.latitude && userLocation?.longitude) {
      return this.getRaffles(undefined, userLocation.latitude, userLocation.longitude);
    }
    return this.getRaffles();
  }

  getRaffle(id: number): Observable<RaffleDetail> {
    return this.http.get<RaffleDetail>(`${this.API_URL}/raffles/${id}/`);
  }

  createRaffle(data: any): Observable<Raffle> {
    console.log('RaffleService - Original data:', data);

    // For now, let's try pure JSON instead of FormData
    const requestData = {
      name: data.name,
      description: data.description,
      terms_conditions: data.terms_conditions,
      ticket_price: data.ticket_price,
      total_tickets: data.total_tickets,
      start_date: data.start_date,
      end_date: data.end_date,
      scope: data.scope,
      allowed_locations: data.allowed_locations,
      // Include image fields if they exist
      ...(data.image_base64 && { image_base64: data.image_base64 }),
      ...(data.image_name && { image_name: data.image_name })
    };

    console.log('RaffleService - Sending JSON data:', requestData);

    return this.http.post<Raffle>(`${this.API_URL}/raffles/create/`, requestData);
  }

  updateRaffle(id: number, data: Partial<CreateRaffleRequest>): Observable<Raffle> {
    return this.http.put<Raffle>(
      `${this.API_URL}/raffles/${id}/`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const today = new Date().toISOString().slice(0, 10);
    if (data.start_date === today) {
      (data as any).status = 'activa';
    }
    return this.http.put<Raffle>(
      `${this.API_URL}/raffles/${id}/`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  deleteRaffle(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/raffles/${id}/`);
  }

  getUserRaffles(): Observable<{count: number, results: Raffle[]}> {
    return this.http.get<{count: number, results: Raffle[]}>(`${this.API_URL}/raffles/my-raffles/`);
  }

  getRaffleTickets(raffleId: number): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.API_URL}/raffles/${raffleId}/tickets/`);
  }

  // Métodos de geolocalización
  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.API_URL}/locations/`);
  }

  detectUserLocation(): void {
    console.log('RaffleService: Starting location detection...');

    if (navigator.geolocation) {
      console.log('RaffleService: Requesting GPS location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('RaffleService: GPS location obtained:', { latitude, longitude });

          this.getLocationFromCoordinates(latitude, longitude).subscribe({
            next: (location) => {
              console.log('RaffleService: Location from coordinates:', location);
              this.userLocationSubject.next({
                ...location,
                latitude,
                longitude
              });
            },
            error: (error) => {
              console.error('RaffleService: Error getting location from coordinates:', error);
              this.detectLocationByExternalIP();
            }
          });
        },
        (error) => {
          console.log('RaffleService: GPS not available or denied:', error.message);
          this.detectLocationByExternalIP();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000 // 10 minutos
        }
      );
    } else {
      console.log('RaffleService: Geolocation not supported');
      this.detectLocationByExternalIP();
    }
  }

  // Método público para forzar la detección de ubicación
  forceLocationRefresh(): void {
    console.log('RaffleService: Forcing location refresh...');
    this.detectUserLocation();
  }

  private getLocationFromCoordinates(lat: number, lng: number): Observable<UserLocation> {
    return this.http.get<UserLocation>(`${this.API_URL}/location/from-coordinates/`, {
      params: { lat: lat.toString(), lng: lng.toString() }
    });
  }

  private detectLocationByExternalIP(): void {
    console.log('RaffleService: Detecting location by external IP...');

    // Usar un servicio externo para obtener la IP pública y la ubicación
    this.http.get<any>('https://ipapi.co/json/').subscribe({
      next: (data) => {
        console.log('RaffleService: External IP location data:', data);

        if (data && data.city && data.country_name) {
          const location: UserLocation = {
            country: data.country_name,
            country_code: data.country_code,
            state: data.region,
            city: data.city,
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude)
          };

          console.log('RaffleService: Setting external IP location:', location);
          this.userLocationSubject.next(location);
        } else {
          console.log('RaffleService: Invalid external IP data, trying backend fallback');
          this.detectLocationByIP();
        }
      },
      error: (error) => {
        console.error('RaffleService: Error with external IP service:', error);
        console.log('RaffleService: Trying backend IP detection...');
        this.detectLocationByIP();
      }
    });
  }

  private detectLocationByIP(): void {
    console.log('RaffleService: Using backend IP detection...');
    this.http.get<UserLocation>(`${this.API_URL}/location/by-ip/`).subscribe({
      next: (location) => {
        console.log('RaffleService: Backend IP location:', location);
        this.userLocationSubject.next(location);
      },
      error: (error) => {
        console.error('RaffleService: Error detecting location by IP:', error);
        console.log('RaffleService: Using fallback location (Ecuador)');
        // Ubicación por defecto (Ecuador - Guayaquil)
        this.userLocationSubject.next({
          country: 'Ecuador',
          country_code: 'EC',
          state: 'Guayas',
          city: 'Guayaquil',
          latitude: -2.170998,
          longitude: -79.922359
        });
      }
    });
  }

  getUserLocation(): UserLocation | null {
    return this.userLocationSubject.value;
  }

  setUserLocation(location: UserLocation): void {
    this.userLocationSubject.next(location);
  }

  getRaffleStatistics(): Observable<{
    total_active_raffles: number,
    total_raffles: number,
    total_tickets_sold: number
  }> {
    return this.http.get<{
      total_active_raffles: number,
      total_raffles: number,
      total_tickets_sold: number
    }>(`${this.API_URL}/statistics/`);
  }

  // Métodos para sorteos
  performDraw(raffleId: number): Observable<{
    winner_ticket: number,
    winner_name: string,
    winner_email: string,
    draw_date: string
  }> {
    return this.http.post<{
      winner_ticket: number,
      winner_name: string,
      winner_email: string,
      draw_date: string
    }>(`${this.API_URL}/raffles/${raffleId}/draw/`, {});
  }

  updateRaffleStatus(raffleId: number, status: 'completed'): Observable<Raffle> {
    return this.http.patch<Raffle>(`${this.API_URL}/raffles/${raffleId}/`, { status });
  }

  getSoldTickets(raffleId: number): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.API_URL}/raffles/${raffleId}/sold-tickets/`);
  }

  activateRafflesStartingToday(): Observable<any> {
    const today = new Date().toISOString().slice(0, 10);
    return this.http.post(`${this.API_URL}/raffles/activate-today/`, { today });
  }
}
