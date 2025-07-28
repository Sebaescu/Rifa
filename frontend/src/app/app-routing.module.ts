import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
    canActivate: [GuestGuard]
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'raffles',
    loadChildren: () => import('./features/raffles/raffles.module').then(m => m.RafflesModule)
  },
  {
    path: 'gestionar-rifas',
    loadChildren: () => import('./features/manage-raffles/manage-raffles.module').then(m => m.ManageRafflesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.module').then(m => m.CartModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'mis-rifas',
    loadChildren: () => import('./features/my-raffles/my-raffles.module').then(m => m.MyRafflesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'draw/:id',
    loadChildren: () => import('./features/draw/draw.module').then(m => m.DrawModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'sorteo/:id',
    loadChildren: () => import('./features/draw/draw.module').then(m => m.DrawModule),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
