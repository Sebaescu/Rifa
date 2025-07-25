from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rifas.models import Raffle, Location
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample raffles for testing'

    def handle(self, *args, **options):
        # Get or create a user for testing
        user, created = User.objects.get_or_create(
            email='admin@rifapp.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'RifApp',
                'is_staff': True,
                'is_superuser': True,
                'email_verified': True
            }
        )
        if created:
            user.set_password('admin123')
            user.save()
            self.stdout.write(f"Created admin user: {user.email}")

        # Get locations
        guayaquil = Location.objects.get(city="Guayaquil", state="Guayas")
        quito = Location.objects.get(city="Quito", state="Pichincha")
        guayas_state = Location.objects.get(state="Guayas", city__isnull=True)
        ecuador_country = Location.objects.get(country="Ecuador", state__isnull=True)

        # Sample raffles
        raffles_data = [
            {
                'name': 'Smartphone iPhone 15 Pro',
                'description': 'Gana el último iPhone 15 Pro de 256GB en color azul titanio. Incluye cargador y auriculares originales.',
                'ticket_price': Decimal('5.00'),
                'total_tickets': 200,
                'scope': 'local',
                'locations': [guayaquil]
            },
            {
                'name': 'Laptop Gaming ASUS ROG',
                'description': 'Laptop gaming de alta gama ASUS ROG Strix con RTX 4060, 16GB RAM, SSD 1TB. Perfecta para gaming y trabajo.',
                'ticket_price': Decimal('10.00'),
                'total_tickets': 500,
                'scope': 'local',
                'locations': [quito]
            },
            {
                'name': 'Motocicleta Yamaha MT-03',
                'description': 'Motocicleta Yamaha MT-03 2024, 321cc, color azul. Incluye casco y documentos al día.',
                'ticket_price': Decimal('15.00'),
                'total_tickets': 800,
                'scope': 'state',
                'locations': [guayas_state]
            },
            {
                'name': 'Automóvil Chevrolet Spark',
                'description': 'Chevrolet Spark 2024, automático, aire acondicionado, 4 puertas. Color blanco, 0 km.',
                'ticket_price': Decimal('25.00'),
                'total_tickets': 1000,
                'scope': 'national',
                'locations': [ecuador_country]
            },
            {
                'name': 'Viaje a Disney World',
                'description': 'Viaje familiar a Disney World Orlando para 4 personas. Incluye vuelos, hotel 5 días/4 noches y entradas a parques.',
                'ticket_price': Decimal('20.00'),
                'total_tickets': 600,
                'scope': 'international',
                'locations': []
            },
            {
                'name': 'Smart TV Samsung 65"',
                'description': 'Smart TV Samsung 65 pulgadas 4K UHD, HDR, Tizen OS. Perfecta para entretenimiento familiar.',
                'ticket_price': Decimal('8.00'),
                'total_tickets': 300,
                'scope': 'local',
                'locations': [guayaquil]
            }
        ]

        created_count = 0
        for raffle_data in raffles_data:
            locations = raffle_data.pop('locations')
            
            raffle, created = Raffle.objects.get_or_create(
                name=raffle_data['name'],
                defaults={
                    **raffle_data,
                    'created_by': user,
                    'start_date': timezone.now(),
                    'end_date': timezone.now() + timedelta(days=30),
                    'status': 'active'
                }
            )
            
            if created:
                raffle.allowed_locations.set(locations)
                created_count += 1
                self.stdout.write(f"Created raffle: {raffle.name}")

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} sample raffles')
        )
