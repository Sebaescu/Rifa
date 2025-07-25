import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Cart, AddToCartRequest, Order, CheckoutRequest, UserTickets } from '../../shared/models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly API_URL = 'http://localhost:8000/api';
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

  private refreshCart(): void {
    this.getCart().subscribe();
  }

  getCurrentCart(): Cart | null {
    return this.cartSubject.value;
  }

  getCartItemCount(): Observable<number> {
    return this.cart$.pipe(
      map(cart => cart ? cart.items.length : 0)
    );
  }
}
