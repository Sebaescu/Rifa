from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rifas.models import Cart

User = get_user_model()

class Command(BaseCommand):
    help = 'Create carts for users who do not have one'
    
    def handle(self, *args, **options):
        users_without_cart = []
        
        for user in User.objects.all():
            try:
                _ = user.cart
            except Cart.DoesNotExist:
                users_without_cart.append(user)
        
        if users_without_cart:
            self.stdout.write(f"Found {len(users_without_cart)} users without carts")
            
            for user in users_without_cart:
                cart = Cart.objects.create(user=user)
                self.stdout.write(
                    self.style.SUCCESS(f"Created cart for user: {user.email} (ID: {user.id})")
                )
        else:
            self.stdout.write(self.style.SUCCESS("All users already have carts"))
        
        self.stdout.write(self.style.SUCCESS("Command completed successfully"))
