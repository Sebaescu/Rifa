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
    const formData = new FormData();

    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined && value !== null) {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.http.put<Raffle>(`${this.API_URL}/raffles/${id}/`, formData);
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.getLocationFromCoordinates(latitude, longitude).subscribe(
            (location) => {
              this.userLocationSubject.next({
                ...location,
                latitude,
                longitude
              });
            },
            (error) => {
              console.error('Error getting location from coordinates:', error);
              // Fallback: detectar ubicación por IP
              this.detectLocationByIP();
            }
          );
        },
        (error) => {
          console.error('Error getting geolocation:', error);
          // Fallback: detectar ubicación por IP
          this.detectLocationByIP();
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser');
      // Fallback: detectar ubicación por IP
      this.detectLocationByIP();
    }
  }

  private getLocationFromCoordinates(lat: number, lng: number): Observable<UserLocation> {
    return this.http.get<UserLocation>(`${this.API_URL}/location/from-coordinates/`, {
      params: { lat: lat.toString(), lng: lng.toString() }
    });
  }

  private detectLocationByIP(): void {
    this.http.get<UserLocation>(`${this.API_URL}/location/by-ip/`).subscribe(
      (location) => {
        this.userLocationSubject.next(location);
      },
      (error) => {
        console.error('Error detecting location by IP:', error);
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
    );
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
}
