import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Components
import { RaffleListComponent } from './raffle-list/raffle-list.component';
import { CreateRaffleComponent } from './create-raffle/create-raffle.component';
import { TicketSelectionComponent } from './ticket-selection/ticket-selection.component';

const routes: Routes = [
  { path: '', component: RaffleListComponent },
  { path: 'create', component: CreateRaffleComponent },
  { path: 'create/:id', component: CreateRaffleComponent }, // Ruta para editar rifa
  { path: ':id/tickets', component: TicketSelectionComponent },
  { path: ':id', component: RaffleListComponent } // Temporary, will create detail component later
];

@NgModule({
  declarations: [
    RaffleListComponent,
    CreateRaffleComponent,
    TicketSelectionComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatCheckboxModule
  ]
})
export class RafflesModule { }
