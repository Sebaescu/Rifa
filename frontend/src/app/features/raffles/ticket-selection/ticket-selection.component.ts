import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RaffleService } from '../../../core/services/raffle.service';
import { CartService } from '../../../core/services/cart.service';
import { Raffle, Ticket } from '../../../shared/models/raffle.model';

@Component({
  selector: 'app-ticket-selection',
  standalone: false,
  templateUrl: './ticket-selection.component.html',
  styleUrls: ['./ticket-selection.component.scss']
})
export class TicketSelectionComponent implements OnInit, OnDestroy {
  raffle: Raffle | null = null;
  tickets: Ticket[] = [];
  selectedTickets: Set<number> = new Set();
  loading = true;
  error: string | null = null;
  ticketFilter: string = '';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private raffleService: RaffleService,
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const raffleId = this.route.snapshot.paramMap.get('id');
    if (raffleId) {
      this.loadRaffleAndTickets(parseInt(raffleId));
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadRaffleAndTickets(raffleId: number): void {
    this.loading = true;
    this.error = null;

    // Cargar información de la rifa
    const raffleSub = this.raffleService.getRaffle(raffleId).subscribe({
      next: (raffle: Raffle) => {
        this.raffle = raffle;
        this.loadTickets(raffleId);
      },
      error: (error: any) => {
        console.error('Error loading raffle:', error);
        this.error = 'Error al cargar la información de la rifa';
        this.loading = false;
      }
    });

    this.subscriptions.add(raffleSub);
  }

  private loadTickets(raffleId: number): void {
    const ticketsSub = this.raffleService.getRaffleTickets(raffleId).subscribe({
      next: (tickets: Ticket[]) => {
        this.tickets = tickets;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading tickets:', error);
        this.error = 'Error al cargar los tickets disponibles';
        this.loading = false;
      }
    });

    this.subscriptions.add(ticketsSub);
  }

  toggleTicketSelection(ticketId: number): void {
    if (this.selectedTickets.has(ticketId)) {
      this.selectedTickets.delete(ticketId);
    } else {
      this.selectedTickets.add(ticketId);
    }
  }

  isTicketSelected(ticketId: number): boolean {
    return this.selectedTickets.has(ticketId);
  }

  isTicketAvailable(ticket: Ticket): boolean {
    return ticket.status === 'available';
  }

  getTicketStatusClass(ticket: Ticket): string {
    switch (ticket.status) {
      case 'available':
        return 'ticket-available';
      case 'reserved':
        return 'ticket-reserved';
      case 'sold':
        return 'ticket-sold';
      default:
        return 'ticket-unavailable';
    }
  }

  getTicketTooltip(ticket: Ticket): string {
    switch (ticket.status) {
      case 'available':
        return 'Clic para seleccionar este ticket';
      case 'reserved':
        return 'Ticket reservado temporalmente';
      case 'sold':
        return 'Ticket vendido';
      default:
        return 'Ticket no disponible';
    }
  }

  getSelectedTicketsCount(): number {
    return this.selectedTickets.size;
  }

  getTotalPrice(): number {
    if (!this.raffle) return 0;
    return this.selectedTickets.size * this.raffle.ticket_price;
  }

  addSelectedTicketsToCart(): void {
    if (this.selectedTickets.size === 0) {
      this.showMessage('Por favor selecciona al menos un ticket');
      return;
    }

    const ticketIds = Array.from(this.selectedTickets);

    this.cartService.addTicketsToCart(ticketIds).subscribe({
      next: (response: any) => {
        const count = this.selectedTickets.size;
        this.showMessage(`${count} ticket${count > 1 ? 's' : ''} agregado${count > 1 ? 's' : ''} al carrito`);

        // Limpiar selección y recargar tickets para mostrar el nuevo estado
        this.selectedTickets.clear();
        if (this.raffle) {
          this.loadTickets(this.raffle.id);
        }
      },
      error: (error: any) => {
        console.error('Error adding tickets to cart:', error);
        const errorMessage = error.error?.error || 'Error al agregar tickets al carrito';
        this.showMessage(errorMessage);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('es-ES', options);
  }

  getRemainingDays(): number | null {
    if (!this.raffle?.end_date) {
      return null;
    }

    const drawDate = new Date(this.raffle.end_date);
    const today = new Date();
    const diffTime = drawDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  getFilteredTickets(): Ticket[] {
    if (!this.ticketFilter || this.ticketFilter.trim() === '') {
      return this.tickets;
    }

    const filterNumber = parseInt(this.ticketFilter);
    if (isNaN(filterNumber) || filterNumber <= 0) {
      return this.tickets;
    }

    return this.tickets.filter(ticket => ticket.number >= filterNumber);
  }

  getMaxTicketNumber(): number {
    if (!this.raffle) {
      return 1000;
    }
    return this.raffle.total_tickets;
  }

  onFilterChange(value: string): void {
    // Solo permitir números en el input
    const numericValue = value.replace(/[^0-9]/g, '');
    this.ticketFilter = numericValue;

    // Validar que el valor esté dentro del rango válido si no está vacío
    if (numericValue) {
      const numberValue = parseInt(numericValue);
      if (numberValue > this.getMaxTicketNumber()) {
        this.ticketFilter = this.getMaxTicketNumber().toString();
      } else if (numberValue < 1) {
        this.ticketFilter = '1';
      }
    }
  }

  clearFilter(): void {
    this.ticketFilter = '';
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
