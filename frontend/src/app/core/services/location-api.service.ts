import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Country {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  phonecode: string;
  capital: string;
  currency: string;
  native: string;
  emoji: string;
  emojiU: string;
}

export interface State {
  id: number;
  name: string;
  iso2: string;
  country_code: string;
  country_id: number;
  country_name: string;
  state_code: string;
  type: string;
  latitude: string;
  longitude: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationApiService {
  private readonly apiUrl = 'https://api.countrystatecity.in/v1';
  private readonly apiKey = 'aTIwT1FYbzZ2emJ5ZEhwSWMwR0tDMzdEMUx0SDRBNzdEV0lDcjF4NA==';

  private httpOptions = {
    headers: new HttpHeaders({
      'X-CSCAPI-KEY': this.apiKey,
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los países disponibles
   */
  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.apiUrl}/countries`, this.httpOptions)
      .pipe(
        map(countries => countries.map(country => ({
          ...country,
          id: parseInt(country.iso2, 36) // Generar ID numérico único basado en iso2
        }))),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene los estados/provincias de un país específico
   * @param countryCode Código ISO2 del país (ej: 'US', 'EC', 'CO')
   */
  getStatesByCountry(countryCode: string): Observable<State[]> {
    return this.http.get<State[]>(`${this.apiUrl}/countries/${countryCode}/states`, this.httpOptions)
      .pipe(
        map(states => states.map(state => ({
          ...state,
          id: parseInt(state.state_code + state.country_code, 36) // Generar ID único
        }))),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene países de una región específica (opcional para filtrar por región)
   */
  getCountriesByRegion(region: string): Observable<Country[]> {
    // La API de countrystatecity no tiene filtro por región directamente
    // Pero podemos filtrar manualmente países de Latinoamérica
    return this.getCountries().pipe(
      map(countries => {
        if (region === 'latin-america') {
          const latinAmericaCodes = ['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'UY', 'VE'];
          return countries.filter(country => latinAmericaCodes.includes(country.iso2));
        }
        return countries;
      })
    );
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 401:
          errorMessage = 'No autorizado: Verifica la API key';
          break;
        case 403:
          errorMessage = 'Acceso prohibido: Límite de API excedido';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 429:
          errorMessage = 'Demasiadas peticiones: Intenta más tarde';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }

    console.error('LocationApiService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
