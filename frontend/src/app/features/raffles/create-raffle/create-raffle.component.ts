import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { RaffleService } from '../../../core/services/raffle.service';
import { LocationApiService, Country, State } from '../../../core/services/location-api.service';
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

  // Loading states
  loadingCountries = true;
  loadingStates = false;

  // Datos geográficos reales de la API
  availableCountries: Country[] = [];
  availableStates: State[] = [];
  selectedCountry: Country | null = null;

  // FormArrays para checkboxes
  selectedCountriesFormArray = new FormArray<FormControl<boolean | null>>([]);
  selectedStatesFormArray = new FormArray<FormControl<boolean | null>>([]);

  scopes = [
    { value: 'provincial', label: 'Provincial', icon: 'location_city', description: 'Selecciona las provincias donde estará disponible tu rifa' },
    { value: 'national', label: 'Nacional', icon: 'flag', description: 'Disponible en todo el país seleccionado' },
    { value: 'international', label: 'Internacional', icon: 'public', description: 'Selecciona los países donde estará disponible' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private raffleService: RaffleService,
    private locationApiService: LocationApiService
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
      terms_conditions: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      ticket_price: ['', [Validators.required, Validators.min(1), Validators.max(10000)]],
      total_tickets: ['', [Validators.required, Validators.min(1), Validators.max(10000)]],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      scope: ['provincial', Validators.required],
      selectedCountry: [''], // Solo requerido para nacional y provincial
      selectedCountries: this.selectedCountriesFormArray, // Para internacional
      selectedStates: this.selectedStatesFormArray // Para provincial
    });
  }

  setupFormSubscriptions(): void {
    // Observar cambios en el scope
    this.raffleForm.get('scope')?.valueChanges.subscribe(scope => {
      this.onScopeChange(scope);
    });

    // Observar selección de país para cargar estados (solo para scope provincial)
    this.raffleForm.get('selectedCountry')?.valueChanges.subscribe(countryCode => {
      if (countryCode && this.raffleForm.get('scope')?.value === 'provincial') {
        this.loadStatesForCountry(countryCode);
      } else {
        this.availableStates = [];
        this.clearStatesSelection();
      }
    });
  }

  loadCountries(): void {
    this.loadingCountries = true;

    // Cargar todos los países del mundo
    this.locationApiService.getCountries().subscribe({
      next: (countries: Country[]) => {
        this.availableCountries = countries.sort((a: Country, b: Country) => a.name.localeCompare(b.name));
        this.initializeCountriesFormArray();
        this.loadingCountries = false;
      },
      error: (error: any) => {
        console.error('Error al cargar países:', error);
        this.snackBar.open('Error al cargar los países. Intenta más tarde.', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.loadingCountries = false;
      }
    });
  }

  initializeCountriesFormArray(): void {
    // Limpiar FormArray existente
    while (this.selectedCountriesFormArray.length !== 0) {
      this.selectedCountriesFormArray.removeAt(0);
    }

    // Crear controles para cada país
    this.availableCountries.forEach(() => {
      this.selectedCountriesFormArray.push(new FormControl(false));
    });
  }

  initializeStatesFormArray(): void {
    // Limpiar FormArray existente
    while (this.selectedStatesFormArray.length !== 0) {
      this.selectedStatesFormArray.removeAt(0);
    }

    // Crear controles para cada estado
    this.availableStates.forEach(() => {
      this.selectedStatesFormArray.push(new FormControl(false));
    });
  }

  onScopeChange(scope: string): void {
    // Limpiar selecciones previas
    this.clearAllSelections();

    // Configurar validaciones según el scope
    const countryControl = this.raffleForm.get('selectedCountry');
    const countriesControl = this.raffleForm.get('selectedCountries');
    const statesControl = this.raffleForm.get('selectedStates');

    // Limpiar todas las validaciones
    countryControl?.clearValidators();
    countriesControl?.clearValidators();
    statesControl?.clearValidators();

    switch (scope) {
      case 'national':
        // Solo requiere selección de un país
        countryControl?.setValidators([Validators.required]);
        break;
      case 'provincial':
        // Requiere país y al menos un estado
        countryControl?.setValidators([Validators.required]);
        statesControl?.setValidators([this.atLeastOneSelectedValidator]);
        break;
      case 'international':
        // Requiere al menos un país
        countriesControl?.setValidators([this.atLeastOneSelectedValidator]);
        break;
    }

    // Actualizar validaciones
    countryControl?.updateValueAndValidity();
    countriesControl?.updateValueAndValidity();
    statesControl?.updateValueAndValidity();
  }

  loadStatesForCountry(countryCode: string): void {
    this.loadingStates = true;
    this.availableStates = [];
    this.clearStatesSelection();

    // Cargar estados del país seleccionado
    this.locationApiService.getStatesByCountry(countryCode).subscribe({
      next: (states: State[]) => {
        this.availableStates = states.sort((a: State, b: State) => a.name.localeCompare(b.name));
        this.initializeStatesFormArray();
        this.loadingStates = false;
      },
      error: (error: any) => {
        console.error('Error al cargar estados:', error);
        this.snackBar.open('Error al cargar los estados. Intenta más tarde.', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.loadingStates = false;
      }
    });
  }

  clearAllSelections(): void {
    this.raffleForm.patchValue({
      selectedCountry: '',
    });
    this.clearCountriesSelection();
    this.clearStatesSelection();
    this.availableStates = [];
  }

  clearCountriesSelection(): void {
    this.selectedCountriesFormArray.controls.forEach(control => {
      control.setValue(false);
    });
  }

  clearStatesSelection(): void {
    this.selectedStatesFormArray.controls.forEach(control => {
      control.setValue(false);
    });
  }

  // Validador personalizado para verificar que al menos uno esté seleccionado
  atLeastOneSelectedValidator(control: any): { [key: string]: any } | null {
    if (control && control.controls) {
      const hasSelection = control.controls.some((ctrl: any) => ctrl.value === true);
      return hasSelection ? null : { atLeastOneRequired: true };
    }
    return { atLeastOneRequired: true };
  }

  onCountryCheckboxChange(event: MatCheckboxChange, index: number): void {
    this.selectedCountriesFormArray.at(index).setValue(event.checked);
  }

  onStateCheckboxChange(event: MatCheckboxChange, index: number): void {
    this.selectedStatesFormArray.at(index).setValue(event.checked);
  }

  getSelectedCountries(): Country[] {
    return this.availableCountries.filter((country, index) =>
      this.selectedCountriesFormArray.at(index)?.value === true
    );
  }

  getSelectedStates(): State[] {
    return this.availableStates.filter((state, index) =>
      this.selectedStatesFormArray.at(index)?.value === true
    );
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
      'terms_conditions': 'Los términos y condiciones',
      'ticket_price': 'El precio por boleto',
      'total_tickets': 'La cantidad de boletos',
      'start_date': 'La fecha de inicio',
      'end_date': 'La fecha de fin',
      'scope': 'El alcance geográfico',
      'selectedCountry': 'El país',
      'selectedCountries': 'Los países',
      'selectedStates': 'Las provincias/estados'
    };

    const friendlyName = fieldLabels[fieldName] || fieldName;

    if (field?.errors) {
      if (field.errors['required']) return `${friendlyName} es requerido`;
      if (field.errors['atLeastOneRequired']) return `Debe seleccionar al menos uno`;
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
      const formValues = this.raffleForm.value;

      // Agregar los campos básicos del formulario
      formData.append('name', formValues.name);
      formData.append('description', formValues.description);
      formData.append('terms_conditions', formValues.terms_conditions);
      formData.append('ticket_price', formValues.ticket_price.toString());
      formData.append('total_tickets', formValues.total_tickets.toString());
      formData.append('start_date', formValues.start_date);
      formData.append('end_date', formValues.end_date);
      formData.append('scope', formValues.scope);

      // Agregar ubicaciones permitidas según el scope
      const allowedLocations: any[] = [];

      switch (formValues.scope) {
        case 'national':
          const selectedCountry = this.availableCountries.find(c => c.iso2 === formValues.selectedCountry);
          if (selectedCountry) {
            allowedLocations.push({
              country_code: selectedCountry.iso2,
              country_name: selectedCountry.name,
              type: 'country'
            });
          }
          break;

        case 'provincial':
          const selectedStates = this.getSelectedStates();
          selectedStates.forEach(state => {
            allowedLocations.push({
              country_code: state.country_code,
              country_name: state.country_name,
              state_code: state.state_code,
              state_name: state.name,
              type: 'state'
            });
          });
          break;

        case 'international':
          const selectedCountries = this.getSelectedCountries();
          selectedCountries.forEach(country => {
            allowedLocations.push({
              country_code: country.iso2,
              country_name: country.name,
              type: 'country'
            });
          });
          break;
      }

      formData.append('allowed_locations', JSON.stringify(allowedLocations));

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

      // Marcar también los controles de FormArray
      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          arrayControl.markAsTouched();
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
