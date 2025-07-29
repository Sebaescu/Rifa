import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../../core/services/cart.service';
import { UserTickets } from '../../../shared/models/cart.model';

@Component({
  selector: 'app-my-raffles',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './my-raffles.component.html',
  styleUrls: ['./my-raffles.component.scss']
})
export class MyRafflesComponent implements OnInit {
  userRaffles$: Observable<UserTickets[]>;
  loading = true;

  constructor(
    private cartService: CartService,
    public router: Router
  ) {
    this.userRaffles$ = this.cartService.getUserTickets();
  }

  ngOnInit(): void {
    this.loadUserRaffles();
  }

  loadUserRaffles(): void {
    this.loading = true;
    this.userRaffles$ = this.cartService.getUserTickets();
    this.userRaffles$.subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) {
      return '/assets/images/default-raffle.jpg';
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    const baseUrl = environment.apiUrl;
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

  trackByRaffleId(index: number, item: UserTickets): number {
    return item.raffle?.id || index;
  }

  trackByTicketId(index: number, item: any): number {
    return item.id || index;
  }

  getTotalTickets(raffles: UserTickets[]): number {
    return raffles.reduce((total, raffleGroup) => {
      return total + (raffleGroup.tickets.length || 0);
    }, 0);
  }

  getTotalInvestment(raffles: UserTickets[]): number {
    return raffles.reduce((total, raffleGroup) => {
      const raffleTotal = raffleGroup.tickets.reduce((subtotal, ticket) => {
        return subtotal + (raffleGroup.raffle?.ticket_price || 0);
      }, 0) || 0;
      return total + raffleTotal;
    }, 0);
  }

  // Verificar si el usuario ganó la rifa
  isWinner(raffleGroup: any): boolean {
    const raffle = raffleGroup.raffle;
    const userTickets = raffleGroup.tickets;

    // Si la rifa no está completada o no tiene ganador, retornar false
    if (raffle?.status !== 'completed' || !raffle?.winner_ticket) {
      return false;
    }

    // Verificar si alguno de los tickets del usuario es el ganador
    return userTickets.some((ticket: any) => ticket.number === raffle.winner_ticket);
  }

  // Obtener el mensaje apropiado para mostrar en la sección de premio
  getPrizeStatus(raffleGroup: any): string {
    const raffle = raffleGroup.raffle;

    if (raffle?.status !== 'completed') {
      return 'Premio';
    }

    if (this.isWinner(raffleGroup)) {
      return '🎉 ¡Ganador!';
    } else {
      return '😔 Sin suerte';
    }
  }

  // Obtener el mensaje descriptivo
  getPrizeMessage(raffleGroup: any): string {
    const raffle = raffleGroup.raffle;

    if (raffle?.status !== 'completed') {
      return raffle?.name || 'Premio por definir';
    }

    if (this.isWinner(raffleGroup)) {
      return `¡Felicidades! Ganaste: ${raffle?.name}`;
    } else {
      return `Número ganador: #${raffle?.winner_ticket} - ${raffle?.winner_name}`;
    }
  }

  getTimeRemaining(endDateString: string | undefined): string {
    if (!endDateString) {
      return 'Fecha no disponible';
    }

    const endDate = new Date(endDateString);
    const now = new Date();
    const diffInMs = endDate.getTime() - now.getTime();

    if (diffInMs <= 0) {
      return 'Finalizada';
    }

    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffInDays > 0) {
      return `${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
    } else if (diffInHours > 0) {
      return `${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    } else {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
    }
  }
}
