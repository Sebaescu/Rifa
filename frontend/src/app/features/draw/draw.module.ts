import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

import { DrawComponent } from './draw.component';

const routes: Routes = [
  {
    path: '',
    component: DrawComponent
  },
  {
    path: 'results',
    component: DrawComponent
  },
  {
    path: 'resultados',
    component: DrawComponent
  }
];

@NgModule({
  declarations: [
    DrawComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule
  ]
})
export class DrawModule { }
