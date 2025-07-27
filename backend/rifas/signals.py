from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Cart

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_cart(sender, instance, created, **kwargs):
    """
    Automatically create a cart when a user is created
    """
    if created:
        Cart.objects.create(user=instance)
        print(f"Cart created for user: {instance.email}")

@receiver(post_save, sender=User)
def save_user_cart(sender, instance, **kwargs):
    """
    Ensure cart exists for existing users
    """
    if not hasattr(instance, 'cart'):
        Cart.objects.create(user=instance)
        print(f"Cart created for existing user: {instance.email}")
