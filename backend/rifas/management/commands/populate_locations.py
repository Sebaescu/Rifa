from django.core.management.base import BaseCommand
from rifas.models import Location

class Command(BaseCommand):
    help = 'Populate database with Ecuador locations'

    def handle(self, *args, **options):
        ecuador_locations = [
            # Ecuador - Major cities
            {"country": "Ecuador", "country_code": "EC", "state": "Guayas", "city": "Guayaquil", "latitude": -2.170998, "longitude": -79.922359},
            {"country": "Ecuador", "country_code": "EC", "state": "Pichincha", "city": "Quito", "latitude": -0.180653, "longitude": -78.467834},
            {"country": "Ecuador", "country_code": "EC", "state": "Azuay", "city": "Cuenca", "latitude": -2.900137, "longitude": -79.005830},
            {"country": "Ecuador", "country_code": "EC", "state": "Manabí", "city": "Manta", "latitude": -0.962500, "longitude": -80.712891},
            {"country": "Ecuador", "country_code": "EC", "state": "Tungurahua", "city": "Ambato", "latitude": -1.254418, "longitude": -78.622861},
            {"country": "Ecuador", "country_code": "EC", "state": "Los Ríos", "city": "Babahoyo", "latitude": -1.800000, "longitude": -79.533333},
            {"country": "Ecuador", "country_code": "EC", "state": "El Oro", "city": "Machala", "latitude": -3.258347, "longitude": -79.955932},
            {"country": "Ecuador", "country_code": "EC", "state": "Esmeraldas", "city": "Esmeraldas", "latitude": 0.959500, "longitude": -79.652664},
            {"country": "Ecuador", "country_code": "EC", "state": "Loja", "city": "Loja", "latitude": -3.993056, "longitude": -79.201944},
            {"country": "Ecuador", "country_code": "EC", "state": "Chimborazo", "city": "Riobamba", "latitude": -1.669722, "longitude": -78.654722},
            {"country": "Ecuador", "country_code": "EC", "state": "Imbabura", "city": "Ibarra", "latitude": 0.347222, "longitude": -78.122500},
            {"country": "Ecuador", "country_code": "EC", "state": "Cotopaxi", "city": "Latacunga", "latitude": -0.935278, "longitude": -78.615833},
            {"country": "Ecuador", "country_code": "EC", "state": "Santa Elena", "city": "La Libertad", "latitude": -2.230000, "longitude": -80.906944},
            {"country": "Ecuador", "country_code": "EC", "state": "Galápagos", "city": "Puerto Baquerizo Moreno", "latitude": -0.900000, "longitude": -89.616667},
            
            # Estados para rifas provinciales
            {"country": "Ecuador", "country_code": "EC", "state": "Guayas", "city": None},
            {"country": "Ecuador", "country_code": "EC", "state": "Pichincha", "city": None},
            {"country": "Ecuador", "country_code": "EC", "state": "Azuay", "city": None},
            {"country": "Ecuador", "country_code": "EC", "state": "Manabí", "city": None},
            {"country": "Ecuador", "country_code": "EC", "state": "Tungurahua", "city": None},
            {"country": "Ecuador", "country_code": "EC", "state": "Los Ríos", "city": None},
            {"country": "Ecuador", "country_code": "EC", "state": "El Oro", "city": None},
            {"country": "Ecuador", "country_code": "EC", "state": "Esmeraldas", "city": None},
            {"country": "Ecuador", "country_code": "EC", "state": "Loja", "city": None},
            {"country": "Ecuador", "country_code": "EC", "state": "Chimborazo", "city": None},
            {"country": "Ecuador", "country_code": "EC", "state": "Imbabura", "city": None},
            {"country": "Ecuador", "country_code": "EC", "state": "Cotopaxi", "city": None},
            {"country": "Ecuador", "country_code": "EC", "state": "Santa Elena", "city": None},
            {"country": "Ecuador", "country_code": "EC", "state": "Galápagos", "city": None},
            
            # País completo para rifas nacionales
            {"country": "Ecuador", "country_code": "EC", "state": None, "city": None},
            
            # Algunos países adicionales para rifas internacionales
            {"country": "Colombia", "country_code": "CO", "state": None, "city": None},
            {"country": "Peru", "country_code": "PE", "state": None, "city": None},
            {"country": "Chile", "country_code": "CL", "state": None, "city": None},
            {"country": "Argentina", "country_code": "AR", "state": None, "city": None},
            {"country": "Brazil", "country_code": "BR", "state": None, "city": None},
            {"country": "Mexico", "country_code": "MX", "state": None, "city": None},
            {"country": "United States", "country_code": "US", "state": None, "city": None},
            {"country": "Spain", "country_code": "ES", "state": None, "city": None},
        ]

        created_count = 0
        for location_data in ecuador_locations:
            location, created = Location.objects.get_or_create(
                country=location_data["country"],
                state=location_data["state"],
                city=location_data["city"],
                defaults={
                    "country_code": location_data["country_code"],
                    "latitude": location_data.get("latitude"),
                    "longitude": location_data.get("longitude"),
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f"Created: {location}")

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} locations')
        )
