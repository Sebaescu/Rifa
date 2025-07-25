import { Component } from '@angular/core';

@Component({
  selector: 'app-cart',
  standalone: false,
  template: `
    <div class="container">
      <h1>Carrito de Compras</h1>
      <p>Componente en desarrollo...</p>
    </div>
  `,
  styles: [`
    .container {
      padding: 24px;
      text-align: center;
    }
  `]
})
export class CartComponent {}
