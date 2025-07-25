import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-email-verification',
  standalone: false,
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Verificar Email</mat-card-title>
          <mat-card-subtitle>Hemos enviado un código de verificación a tu email</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="email-info" *ngIf="email">
            <mat-icon>email</mat-icon>
            <p>Se ha enviado un código de 6 dígitos a:</p>
            <strong>{{ email }}</strong>
          </div>

          <form [formGroup]="verificationForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Código de Verificación</mat-label>
              <input
                matInput
                type="text"
                formControlName="code"
                placeholder="123456"
                maxlength="6"
                (input)="onCodeInput($event)">
              <mat-error *ngIf="verificationForm.get('code')?.invalid && verificationForm.get('code')?.touched">
                Código de verificación es requerido (6 dígitos)
              </mat-error>
            </mat-form-field>

            <div class="error-message" *ngIf="errorMessage">
              <mat-icon>error</mat-icon>
              {{ errorMessage }}
            </div>

            <div class="success-message" *ngIf="successMessage">
              <mat-icon>check_circle</mat-icon>
              {{ successMessage }}
            </div>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width submit-button"
              [disabled]="!verificationForm.valid || isLoading">
              <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
              <span *ngIf="!isLoading">Verificar Email</span>
            </button>
          </form>

          <div class="resend-section">
            <p>¿No recibiste el código?</p>
            <button
              mat-button
              color="accent"
              (click)="resendCode()"
              [disabled]="isResending || resendCooldown > 0">
              <span *ngIf="!isResending && resendCooldown === 0">Reenviar código</span>
              <span *ngIf="isResending">Enviando...</span>
              <span *ngIf="resendCooldown > 0">Reenviar en {{ resendCooldown }}s</span>
            </button>
          </div>

          <div class="back-section">
            <button mat-button routerLink="/auth/login">
              <mat-icon>arrow_back</mat-icon>
              Volver al login
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .auth-card {
      max-width: 400px;
      width: 100%;
      padding: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }

    .submit-button {
      height: 48px;
      font-size: 16px;
      margin: 20px 0;
    }

    .email-info {
      text-align: center;
      margin: 20px 0;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .email-info mat-icon {
      color: #2196F3;
      margin-bottom: 10px;
    }

    .email-info p {
      margin: 5px 0;
      color: #666;
    }

    .email-info strong {
      color: #333;
      font-size: 16px;
    }

    .error-message {
      color: #f44336;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 10px 0;
      padding: 10px;
      background-color: #ffebee;
      border-radius: 4px;
    }

    .success-message {
      color: #4caf50;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 10px 0;
      padding: 10px;
      background-color: #e8f5e8;
      border-radius: 4px;
    }

    .resend-section {
      text-align: center;
      margin: 20px 0;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .resend-section p {
      margin-bottom: 10px;
      color: #666;
    }

    .back-section {
      text-align: center;
      margin-top: 20px;
    }

    input[type="text"] {
      text-align: center;
      font-size: 18px;
      letter-spacing: 2px;
      font-weight: bold;
    }
  `]
})
export class EmailVerificationComponent implements OnInit, OnDestroy {
  verificationForm: FormGroup;
  isLoading = false;
  isResending = false;
  errorMessage = '';
  successMessage = '';
  email = '';
  resendCooldown = 0;
  private cooldownInterval?: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.verificationForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit(): void {
    // Obtener el email de los parámetros de la ruta
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        // Si no hay email, redirigir al registro
        this.router.navigate(['/auth/register']);
      }
    });
  }

  onCodeInput(event: any): void {
    // Solo permitir números
    const value = event.target.value.replace(/\D/g, '');
    this.verificationForm.patchValue({ code: value });
  }

  onSubmit(): void {
    if (this.verificationForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const verificationData = {
        email: this.email,
        code: this.verificationForm.value.code
      };

      this.authService.verifyEmail(verificationData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Email verificado exitosamente! Redirigiendo...';

          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/auth/login'], {
              queryParams: { verified: 'true' }
            });
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error.error?.code) {
            this.errorMessage = error.error.code[0];
          } else {
            this.errorMessage = 'Código de verificación inválido o expirado';
          }
        }
      });
    }
  }

  resendCode(): void {
    this.isResending = true;
    this.errorMessage = '';

    this.authService.resendEmailVerification({ email: this.email }).subscribe({
      next: (response) => {
        this.isResending = false;
        this.successMessage = 'Código reenviado exitosamente';
        this.startCooldown();
      },
      error: (error) => {
        this.isResending = false;
        this.errorMessage = 'Error al reenviar el código. Intenta nuevamente.';
      }
    });
  }

  private startCooldown(): void {
    this.resendCooldown = 60; // 60 segundos de cooldown
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }
}
