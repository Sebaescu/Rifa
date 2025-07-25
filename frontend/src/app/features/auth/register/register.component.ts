import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../shared/models/user.model';

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Crear Cuenta</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre de usuario</mat-label>
              <input matInput type="text" formControlName="username" placeholder="Tu nombre de usuario">
              <mat-error *ngIf="registerForm.get('username')?.invalid && registerForm.get('username')?.touched">
                Nombre de usuario es requerido
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre</mat-label>
              <input matInput type="text" formControlName="first_name" placeholder="Tu nombre">
              <mat-error *ngIf="registerForm.get('first_name')?.invalid && registerForm.get('first_name')?.touched">
                Nombre es requerido
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Apellido</mat-label>
              <input matInput type="text" formControlName="last_name" placeholder="Tu apellido">
              <mat-error *ngIf="registerForm.get('last_name')?.invalid && registerForm.get('last_name')?.touched">
                Apellido es requerido
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="tu@email.com">
              <mat-error *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
                Email es requerido y debe ser válido
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
                Contraseña debe tener al menos 8 caracteres
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmar Contraseña</mat-label>
              <input matInput [type]="hideConfirmPassword ? 'password' : 'text'" formControlName="password_confirm">
              <button mat-icon-button matSuffix (click)="hideConfirmPassword = !hideConfirmPassword" type="button">
                <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('password_confirm')?.invalid && registerForm.get('password_confirm')?.touched">
                <span *ngIf="registerForm.get('password_confirm')?.errors?.['required']">
                  Confirmar contraseña es requerido
                </span>
                <span *ngIf="registerForm.get('password_confirm')?.errors?.['mismatch']">
                  Las contraseñas no coinciden
                </span>
              </mat-error>
            </mat-form-field>

            <div class="error-message" *ngIf="errorMessage">
              <mat-icon>error</mat-icon>
              {{ errorMessage }}
            </div>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width submit-button"
              [disabled]="registerForm.invalid || isLoading">
              <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
              {{ isLoading ? 'Registrando...' : 'Registrarse' }}
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p>¿Ya tienes cuenta?
            <a routerLink="/auth/login" mat-button color="primary">Inicia sesión aquí</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 20px;
    }

    .auth-card {
      max-width: 500px;
      width: 100%;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .submit-button {
      margin-top: 16px;
      height: 48px;
    }

    .error-message {
      color: #f44336;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 16px 0;
      font-size: 14px;
    }

    mat-card-actions {
      justify-content: center;
      text-align: center;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirm: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): {[key: string]: any} | null {
    const password = control.get('password');
    const confirmPassword = control.get('password_confirm');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.register(this.registerForm.value).subscribe({
        next: (response: AuthResponse) => {
          this.isLoading = false;
          // Redirigir a verificación de email en lugar de dashboard
          this.router.navigate(['/auth/verify-email'], {
            queryParams: { email: this.registerForm.value.email }
          });
        },
        error: (error: any) => {
          this.isLoading = false;
          if (error.error) {
            // Manejar errores específicos del backend
            if (error.error.email) {
              this.errorMessage = 'Este email ya está registrado';
            } else if (error.error.username) {
              this.errorMessage = 'Este nombre de usuario ya está en uso';
            } else if (error.error.password) {
              this.errorMessage = error.error.password[0];
            } else {
              this.errorMessage = 'Error al registrar usuario. Intenta nuevamente.';
            }
          } else {
            this.errorMessage = 'Error de conexión. Intenta nuevamente.';
          }
        }
      });
    }
  }
}
