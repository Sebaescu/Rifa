import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RaffleService } from '../../../core/services/raffle.service';
import { Location } from '../../../shared/models/raffle.model';

@Component({
  selector: 'app-create-raffle',
  standalone: false,
  templateUrl: './create-raffle.component.html',
  styleUrls: ['./create-raffle.component.scss']
})
export class CreateRaffleComponent implements OnInit {
  raffleForm: FormGroup;
  isLoading = false;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  availableLocations: Location[] = [];

  scopes = [
    { value: 'local', label: 'Local - Solo tu ciudad', icon: 'location_city' },
    { value: 'state', label: 'Provincial - Todo tu estado/provincia', icon: 'map' },
    { value: 'national', label: 'Nacional - Todo el país', icon: 'flag' },
    { value: 'international', label: 'Internacional - Todo el mundo', icon: 'public' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private raffleService: RaffleService
  ) {
    this.raffleForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadLocations();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      ticket_price: ['', [Validators.required, Validators.min(1), Validators.max(10000)]],
      total_tickets: ['', [Validators.required, Validators.min(1), Validators.max(10000)]],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      scope: ['local', Validators.required],
      allowed_locations: [[]],
      terms_conditions: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  private loadLocations(): void {
    // Aquí cargarías las ubicaciones desde el servicio
    // Por ahora dejamos el array vacío
    this.availableLocations = [];
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;

      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSelectImage(): void {
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    // Limpiar el input file
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onScopeChange(): void {
    const scope = this.raffleForm.get('scope')?.value;
    const allowedLocationsControl = this.raffleForm.get('allowed_locations');

    if (scope === 'international') {
      allowedLocationsControl?.setValue([]);
      allowedLocationsControl?.disable();
    } else {
      allowedLocationsControl?.enable();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.raffleForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.raffleForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;
      if (field.errors['email']) return 'Email inválido';
    }
    return '';
  }

  onSubmit(): void {
    if (this.raffleForm.valid) {
      this.isLoading = true;

      const formData = new FormData();

      // Agregar los campos del formulario
      Object.keys(this.raffleForm.value).forEach(key => {
        const value = this.raffleForm.value[key];
        if (value !== null && value !== undefined) {
          if (key === 'allowed_locations') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Agregar la imagen si existe
      if (this.selectedImage) {
        formData.append('image', this.selectedImage);
      }

      // Simular creación de rifa (reemplazar con llamada real al servicio)
      setTimeout(() => {
        this.isLoading = false;
        this.snackBar.open('¡Rifa creada exitosamente!', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/dashboard']);
      }, 2000);

      /*
      // Llamada real al servicio (descomentar cuando esté implementado)
      this.raffleService.createRaffle(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('¡Rifa creada exitosamente!', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/raffles', response.id]);
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open('Error al crear la rifa. Intenta nuevamente.', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
      */
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Por favor, completa todos los campos requeridos', 'Cerrar', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.raffleForm.controls).forEach(key => {
      const control = this.raffleForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
