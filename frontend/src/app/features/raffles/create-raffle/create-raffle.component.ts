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
  raffleForm!: FormGroup;
  isLoading = false;
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  // Datos geográficos
  availableCountries: any[] = [];
  availableStates: any[] = [];
  selectedCountry: any = null;

  scopes = [
    { value: 'provincial', label: 'Provincial - Estados/Provincias específicas', icon: 'location_city', description: 'Selecciona las provincias donde estará disponible tu rifa' },
    { value: 'national', label: 'Nacional - Todo el país', icon: 'flag', description: 'Disponible en todo el país seleccionado' },
    { value: 'international', label: 'Internacional - Múltiples países', icon: 'public', description: 'Selecciona los países donde estará disponible' }
  ];

  // Datos de ejemplo para países y estados
  mockCountries = [
    { id: 0, name: 'Todos los países', code: 'ALL' }, // Opción especial para internacional
    { id: 1, name: 'Ecuador', code: 'EC' },
    { id: 2, name: 'Colombia', code: 'CO' },
    { id: 3, name: 'Perú', code: 'PE' },
    { id: 4, name: 'México', code: 'MX' },
    { id: 5, name: 'Argentina', code: 'AR' },
    { id: 6, name: 'Chile', code: 'CL' },
    { id: 7, name: 'Brasil', code: 'BR' },
    { id: 8, name: 'Uruguay', code: 'UY' },
    { id: 9, name: 'Venezuela', code: 'VE' },
    { id: 10, name: 'Bolivia', code: 'BO' }
  ];

  mockStates: { [key: number]: any[] } = {
    1: [ // Ecuador
      { id: 0, name: 'Todas las provincias', countryId: 1 }, // Opción especial
      { id: 1, name: 'Pichincha', countryId: 1 },
      { id: 2, name: 'Guayas', countryId: 1 },
      { id: 3, name: 'Azuay', countryId: 1 },
      { id: 4, name: 'Manabí', countryId: 1 },
      { id: 5, name: 'El Oro', countryId: 1 },
      { id: 6, name: 'Tungurahua', countryId: 1 }
    ],
    2: [ // Colombia
      { id: 0, name: 'Todos los departamentos', countryId: 2 }, // Opción especial
      { id: 7, name: 'Cundinamarca', countryId: 2 },
      { id: 8, name: 'Antioquia', countryId: 2 },
      { id: 9, name: 'Valle del Cauca', countryId: 2 },
      { id: 10, name: 'Atlántico', countryId: 2 },
      { id: 11, name: 'Santander', countryId: 2 }
    ],
    3: [ // Perú
      { id: 0, name: 'Todos los departamentos', countryId: 3 },
      { id: 12, name: 'Lima', countryId: 3 },
      { id: 13, name: 'Arequipa', countryId: 3 },
      { id: 14, name: 'Cusco', countryId: 3 },
      { id: 15, name: 'La Libertad', countryId: 3 }
    ],
    4: [ // México
      { id: 0, name: 'Todos los estados', countryId: 4 },
      { id: 16, name: 'Ciudad de México', countryId: 4 },
      { id: 17, name: 'Jalisco', countryId: 4 },
      { id: 18, name: 'Nuevo León', countryId: 4 },
      { id: 19, name: 'Yucatán', countryId: 4 }
    ]
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private raffleService: RaffleService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscriptions();
    this.loadCountries();
  }

  initializeForm(): void {
    this.raffleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      ticket_price: ['', [Validators.required, Validators.min(1), Validators.max(10000)]],
      total_tickets: ['', [Validators.required, Validators.min(1), Validators.max(10000)]],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      scope: ['provincial', Validators.required],
      selectedCountry: ['', Validators.required], // Siempre requerido
      selectedStates: [[]]
    });
  }

  setupFormSubscriptions(): void {
    // Observar cambios en el scope
    this.raffleForm.get('scope')?.valueChanges.subscribe(scope => {
      this.onScopeChange(scope);
    });

    // Observar selección de país para cargar estados
    this.raffleForm.get('selectedCountry')?.valueChanges.subscribe(countryId => {
      if (countryId) {
        this.loadStatesForCountry(countryId);
      } else {
        this.availableStates = [];
      }
    });
  }

  loadCountries(): void {
    // En una aplicación real, esto vendría de un servicio
    this.availableCountries = this.mockCountries;
  }

  onScopeChange(scope: string): void {
    // Limpiar selecciones de estados
    this.raffleForm.patchValue({
      selectedStates: []
    });

    this.availableStates = [];

    // Configurar validaciones según el scope
    const statesControl = this.raffleForm.get('selectedStates');

    if (scope === 'provincial') {
      statesControl?.setValidators([Validators.required]);
    } else {
      statesControl?.clearValidators();
    }
    statesControl?.updateValueAndValidity();
  }

  loadStatesForCountry(countryId: number): void {
    if (this.mockStates[countryId]) {
      this.availableStates = this.mockStates[countryId];
    } else {
      this.availableStates = [];
    }
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

  isFieldInvalid(fieldName: string): boolean {
    const field = this.raffleForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.raffleForm.get(fieldName);
    const fieldLabels: { [key: string]: string } = {
      'name': 'El nombre de la rifa',
      'description': 'La descripción',
      'ticket_price': 'El precio por boleto',
      'total_tickets': 'La cantidad de boletos',
      'start_date': 'La fecha de inicio',
      'end_date': 'La fecha de fin',
      'scope': 'El alcance geográfico',
      'selectedCountry': 'El país',
      'selectedStates': 'Las provincias/estados'
    };

    const friendlyName = fieldLabels[fieldName] || fieldName;

    if (field?.errors) {
      if (field.errors['required']) return `${friendlyName} es requerido`;
      if (field.errors['minlength']) return `${friendlyName} debe tener mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `${friendlyName} debe tener máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `${friendlyName} debe ser mínimo ${field.errors['min'].min}`;
      if (field.errors['max']) return `${friendlyName} debe ser máximo ${field.errors['max'].max}`;
      if (field.errors['email']) return 'El formato del email es inválido';
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
