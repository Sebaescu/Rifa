import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Placeholder component for now
import { RaffleListComponent } from './raffle-list/raffle-list.component';

const routes: Routes = [
  { path: '', component: RaffleListComponent },
  { path: ':id', component: RaffleListComponent } // Temporary, will create detail component later
];

@NgModule({
  declarations: [
    RaffleListComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class RafflesModule { }
