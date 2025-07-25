export const EXAMPLE_RAFFLE_IMAGES = {
  // Automóviles
  spark: 'assets/images/raffles/examples/spark.png',
  mt03: 'assets/images/raffles/examples/MT-03.png',

  // Electrónicos
  iphone15: 'assets/images/raffles/examples/iphone 15 pro.png',
  g14: 'assets/images/raffles/examples/g14.png',
  samsungTV: 'assets/images/raffles/examples/samsung tv 65.png',

  // Entretenimiento
  disneyWorld: 'assets/images/raffles/examples/disney world.png',

  // Placeholder
  placeholder: 'assets/images/raffles/examples/placeholder.svg'
};

// Función helper para obtener imagen por categoría
export function getRaffleImageByCategory(category: string, index: number = 1): string {
  const categoryMap: { [key: string]: string[] } = {
    'automotive': [
      EXAMPLE_RAFFLE_IMAGES.spark,
      EXAMPLE_RAFFLE_IMAGES.mt03
    ],
    'electronics': [
      EXAMPLE_RAFFLE_IMAGES.iphone15,
      EXAMPLE_RAFFLE_IMAGES.g14,
      EXAMPLE_RAFFLE_IMAGES.samsungTV
    ],
    'entertainment': [
      EXAMPLE_RAFFLE_IMAGES.disneyWorld
    ],
    'misc': [
      EXAMPLE_RAFFLE_IMAGES.placeholder
    ]
  };

  const images = categoryMap[category] || categoryMap['misc'];
  return images[(index - 1) % images.length] || images[0];
}

// Función para obtener imagen placeholder si no hay imagen
export function getRafflePlaceholder(): string {
  return EXAMPLE_RAFFLE_IMAGES.placeholder;
}
