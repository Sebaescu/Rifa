import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RaffleService } from '../../core/services/raffle.service';
import { Raffle } from '../../shared/models/raffle.model';

@Component({
  selector: 'app-draw',
  standalone: false,
  templateUrl: './draw.component.html',
  styleUrls: ['./draw.component.scss']
})
export class DrawComponent implements OnInit {
  raffle: any = null;
  isLoading = true;
  error: string | null = null;
  isDrawing = false;
  winner: any = null;
  isResultsMode = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private raffleService: RaffleService
  ) {}

  ngOnInit(): void {
    // Detectar si estamos en modo resultados
    this.isResultsMode = this.router.url.includes('/results') || this.router.url.includes('/resultados');
    console.log('Results mode:', this.isResultsMode, 'URL:', this.router.url);
    this.loadRaffle();
  }

  loadRaffle(): void {
    const raffleId = this.route.snapshot.paramMap.get('id');
    if (!raffleId) {
      this.error = 'ID de rifa no válido';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.raffleService.getRaffle(parseInt(raffleId)).subscribe({
      next: (raffle: any) => {
        console.log('Raffle data received:', raffle);
        this.raffle = raffle;
        this.isLoading = false;

        // Solo verificar si está lista para el sorteo si NO estamos en modo resultados
        if (!this.isResultsMode && !this.isReadyForDraw(raffle)) {
          this.error = 'Esta rifa aún no está lista para el sorteo';
        }

        // Si estamos en modo resultados, verificar que tenga ganador
        if (this.isResultsMode) {
          console.log('In results mode - checking for winner data');
          console.log('Raffle status:', raffle.status);
          console.log('Winner data check:', {
            winner_ticket: raffle.winner_ticket,
            winner_name: raffle.winner_name,
            winner_email: raffle.winner_email,
            draw_date: raffle.draw_date
          });

          if (raffle.status === 'completed' && raffle.winner_ticket) {
            this.winner = {
              ticket_number: raffle.winner_ticket,
              user_name: raffle.winner_name,
              user_email: raffle.winner_email
            };
            console.log('Winner data loaded:', this.winner);
          } else {
            console.log('No winner data found or raffle not completed');
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading raffle:', error);
        this.error = 'Error al cargar la información de la rifa';
        this.isLoading = false;
      }
    });
  }

  isReadyForDraw(raffle: any): boolean {
    // La rifa debe estar activa
    if (raffle.status !== 'active') {
      return false;
    }

    // Debe haber al menos un ticket vendido
    if (!raffle.tickets_sold || raffle.tickets_sold === 0) {
      return false;
    }

    // La fecha de finalización debe haber pasado
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const endDate = new Date(raffle.end_date);
    endDate.setHours(23, 59, 59, 999);

    return today > endDate;
  }

  performDraw(): void {
    if (!this.raffle || this.raffle.tickets_sold === 0) {
      return;
    }

    this.isDrawing = true;

    // Llamar al backend para realizar el sorteo real
    this.raffleService.performDraw(this.raffle.id).subscribe({
      next: (drawResult) => {
        // Simular el tiempo de animación antes de mostrar el resultado
        setTimeout(() => {
          this.winner = {
            ticket_number: drawResult.winner_ticket,
            user_name: drawResult.winner_name,
            user_email: drawResult.winner_email
          };

          // Actualizar la rifa con los datos del ganador
          this.raffle.draw_date = drawResult.draw_date;
          this.raffle.winner_ticket = drawResult.winner_ticket;
          this.raffle.winner_name = drawResult.winner_name;
          this.raffle.winner_email = drawResult.winner_email;

          this.isDrawing = false;

          console.log('Sorteo completado:', this.winner);

          // Actualizar el estado de la rifa a completada
          this.updateRaffleToCompleted();

          // Redirigir a resultados después de 5 segundos
          setTimeout(() => {
            this.navigateToResults();
          }, 5000);

        }, 3000); // 3 segundos de animación del sorteo
      },
      error: (error) => {
        console.error('Error performing draw:', error);
        this.error = 'Error al realizar el sorteo. Por favor, inténtalo de nuevo.';
        this.isDrawing = false;
      }
    });
  }

  private updateRaffleToCompleted(): void {
    this.raffleService.updateRaffleStatus(this.raffle.id, 'completed').subscribe({
      next: (updatedRaffle) => {
        this.raffle.status = 'completed';
        console.log('Rifa actualizada a completada:', updatedRaffle);
      },
      error: (error) => {
        console.error('Error updating raffle status:', error);
        // No mostramos error al usuario ya que el sorteo se realizó correctamente
      }
    });
  }

  private navigateToResults(): void {
    // Navegar a la página de resultados
    this.router.navigate(['/sorteo', this.raffle.id, 'resultados']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) {
      return '/assets/images/default-raffle.jpg';
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    return `http://localhost:8000${imageUrl}`;
  }

  goBack(): void {
    this.router.navigate(['/gestionar-rifas']);
  }
}
