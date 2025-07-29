import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Cart, AddToCartRequest, Order, CheckoutRequest, UserTickets } from '../../shared/models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly API_URL = environment.apiUrl;
  private cartSubject = new BehaviorSubject<Cart | null>(null);

  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.API_URL}/cart/`)
      .pipe(
        tap(cart => this.cartSubject.next(cart))
      );
  }

  addToCart(request: AddToCartRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/cart/add/`, request)
      .pipe(
        tap(() => this.refreshCart())
      );
  }

  addRaffleToCart(raffleId: number): Observable<any> {
    return this.http.post(`${this.API_URL}/cart/add-raffle/`, { raffle_id: raffleId })
      .pipe(
        tap(() => this.refreshCart())
      );
  }

  addTicketsToCart(ticketIds: number[]): Observable<any> {
    return this.http.post(`${this.API_URL}/cart/add-tickets/`, { ticket_ids: ticketIds })
      .pipe(
        tap(() => this.refreshCart())
      );
  }

  removeFromCart(ticketId: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/cart/remove/${ticketId}/`)
      .pipe(
        tap(() => this.refreshCart())
      );
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.API_URL}/cart/clear/`)
      .pipe(
        tap(() => this.cartSubject.next(null))
      );
  }

  checkout(request: CheckoutRequest): Observable<{order: Order, message: string}> {
    return this.http.post<{order: Order, message: string}>(`${this.API_URL}/orders/checkout/`, request)
      .pipe(
        tap(() => this.cartSubject.next(null))
      );
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/orders/`);
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.API_URL}/orders/${id}/`);
  }

  getUserTickets(): Observable<UserTickets[]> {
    return this.http.get<UserTickets[]>(`${this.API_URL}/my-tickets/`);
  }

  getItemCount(): Observable<number> {
    return this.cart$.pipe(
      map(cart => {
        if (!cart || !cart.items) return 0;
        return cart.items.length;
      })
    );
  }

  // Método para inicializar el carrito automáticamente
  initializeCart(): void {
    this.getCart().subscribe({
      next: (cart) => {
        // El carrito se actualiza automáticamente via tap() en getCart()
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        // En caso de error, mantener cart como null
      }
    });
  }

  private refreshCart(): void {
    this.getCart().subscribe();
  }
}
