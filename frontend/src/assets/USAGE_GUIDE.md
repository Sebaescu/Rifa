# Guía de Uso de Assets para Rifas

## 📁 Estructura creada:
```
src/assets/
├── images/
│   ├── icons/          # Iconos de la aplicación
│   ├── logos/          # Logos de la marca
│   └── raffles/
│       └── examples/   # Imágenes de ejemplo para rifas
│           ├── disney world.png
│           ├── g14.png
│           ├── iphone 15 pro.png
│           ├── MT-03.png
│           ├── samsung tv 65.png
│           ├── spark.png
│           ├── raffle-images.constants.ts
│           └── README.md
```

## 🎯 Imágenes disponibles:
- **spark.png** - Automóvil Chevrolet Spark
- **MT-03.png** - Motocicleta Yamaha MT-03
- **iphone 15 pro.png** - iPhone 15 Pro
- **g14.png** - Laptop Gaming G14
- **samsung tv 65.png** - Televisor Samsung 65"
- **disney world.png** - Viaje a Disney World

## 💻 Cómo usar en componentes:

### 1. Importar las constantes:
```typescript
import { EXAMPLE_RAFFLE_IMAGES, getRaffleImageByCategory } from '../../../../assets/images/raffles/examples/raffle-images.constants';
```

### 2. Usar imágenes específicas:
```typescript
// En el componente
export class RaffleCardComponent {
  raffleImage = EXAMPLE_RAFFLE_IMAGES.iphone15;
}
```

```html
<!-- En el template -->
<img [src]="raffleImage" alt="iPhone 15 Pro" class="raffle-image">
```

### 3. Usar por categoría (recomendado):
```typescript
// En el componente
export class RaffleListComponent {
  getRaffleImage(category: string, index: number = 1): string {
    return getRaffleImageByCategory(category, index);
  }
}
```

```html
<!-- En el template -->
<img [src]="getRaffleImage('electronics', 1)" alt="Producto electrónico">
<img [src]="getRaffleImage('automotive', 2)" alt="Vehículo">
```

### 4. Uso directo en HTML:
```html
<img src="assets/images/raffles/examples/iphone 15 pro.png" alt="iPhone 15 Pro">
```

## 🛡️ Configuración Angular:
✅ **angular.json** ya está configurado para incluir la carpeta `src/assets`

## 📊 Categorías disponibles:
- `automotive` - Automóviles y motocicletas
- `electronics` - Dispositivos electrónicos
- `entertainment` - Entretenimiento y viajes
- `misc` - Otros (placeholder)

## 🔧 Para agregar más imágenes:
1. Agrega las imágenes a la carpeta `examples/`
2. Actualiza `EXAMPLE_RAFFLE_IMAGES` en `raffle-images.constants.ts`
3. Agrega la categoría correspondiente en `getRaffleImageByCategory()`

## 🎨 Recomendaciones:
- **Formato:** PNG para calidad, JPG para archivos más ligeros
- **Tamaño:** 800x600px o proporciones similares
- **Peso:** Máximo 500KB por imagen
- **Nombres:** Sin espacios, usar guiones o camelCase
