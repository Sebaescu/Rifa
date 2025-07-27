import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../../../core/services/cart.service';
import { Cart, CartItem, CheckoutRequest } from '../../../shared/models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  isLoading = true;
  isProcessing = false;

  // Estados para popups
  showConfirmationDialog = false;
  showPaymentProgress = false;
  showSuccessDialog = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private cartService: CartService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCart();

    // Suscribirse a cambios en el carrito
    const cartSub = this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.isLoading = false;
    });
    this.subscriptions.push(cartSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCart(): void {
    this.isLoading = true;
    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cart = cart;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.isLoading = false;
        this.showMessage('Error al cargar el carrito');
      }
    });
  }

  removeItem(item: CartItem): void {
    if (!item.ticket) return;

    this.isProcessing = true;
    this.cartService.removeFromCart(item.ticket.id).subscribe({
      next: () => {
        this.showMessage('Boleto removido del carrito');
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error removing item:', error);
        this.showMessage('Error al remover el boleto');
        this.isProcessing = false;
      }
    });
  }

  clearCart(): void {
    if (!this.cart || this.cart.items.length === 0) return;

    this.isProcessing = true;
    this.cartService.clearCart().subscribe({
      next: () => {
        this.showMessage('Carrito vaciado');
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error clearing cart:', error);
        this.showMessage('Error al vaciar el carrito');
        this.isProcessing = false;
      }
    });
  }

  proceedToCheckout(): void {
    if (!this.cart || this.cart.items.length === 0) {
      this.showMessage('No hay boletos en el carrito');
      return;
    }

    // Mostrar popup de confirmación
    this.showConfirmationDialog = true;
  }

  confirmPurchase(): void {
    this.showConfirmationDialog = false;
    this.showPaymentProgress = true;
    this.isProcessing = true;

    // Simular proceso de pago (3 segundos)
    setTimeout(() => {
      this.processPurchase();
    }, 3000);
  }

  cancelPurchase(): void {
    this.showConfirmationDialog = false;
    this.showMessage('Compra cancelada');
  }

  private processPurchase(): void {
    if (!this.cart) return;

    // Preparar datos para checkout
    const checkoutData: CheckoutRequest = {
      payment_method: 'simulated'
    };

    this.cartService.checkout(checkoutData).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.showPaymentProgress = false;
        this.showSuccessDialog = true;

        // Limpiar el carrito
        this.cart = null;
      },
      error: (error) => {
        this.isProcessing = false;
        this.showPaymentProgress = false;
        console.error('Error processing purchase:', error);
        this.showMessage('Error al procesar la compra. Inténtalo de nuevo.');
      }
    });
  }

  closeSuccessDialog(): void {
    this.showSuccessDialog = false;
    this.router.navigate(['/dashboard']);
  }

  continueShopping(): void {
    this.router.navigate(['/dashboard']);
  }

  viewRaffleDetails(raffleId: number): void {
    this.router.navigate(['/raffles', raffleId]);
  }

  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) {
      return '/assets/images/default-raffle.jpg';
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    const baseUrl = 'http://localhost:8000';
    return `${baseUrl}${imageUrl}`;
  }

  getScopeIcon(scope: string): string {
    const icons = {
      'local': 'location_on',
      'state': 'flag',
      'national': 'flag',
      'international': 'public'
    };
    return icons[scope as keyof typeof icons] || 'help';
  }

  getScopeText(scope: string): string {
    const texts = {
      'local': 'Local',
      'state': 'Provincial',
      'national': 'Nacional',
      'international': 'Internacional'
    };
    return texts[scope as keyof typeof texts] || scope;
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'hace un momento';
    } else if (diffInHours < 24) {
      return `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
    }
  }

  trackByItemId(index: number, item: CartItem): number {
    return item.id;
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
