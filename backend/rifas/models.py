from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import timedelta
import uuid

User = get_user_model()

class Location(models.Model):
    country = models.CharField(max_length=100)
    country_code = models.CharField(max_length=2)
    state = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['country', 'state', 'city']
        ordering = ['country', 'state', 'city']
    
    def __str__(self):
        parts = [self.city, self.state, self.country]
        return ', '.join([part for part in parts if part])

class Raffle(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    SCOPE_CHOICES = [
        ('provincial', 'Provincial'),
        ('national', 'National'),
        ('international', 'International'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    ticket_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_tickets = models.PositiveIntegerField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    image = models.ImageField(upload_to='raffles/', blank=True, null=True)
    terms_conditions = models.TextField(blank=True)
    
    # Geolocation fields
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='provincial')
    allowed_locations = models.ManyToManyField(Location, blank=True, related_name='raffles')
    
    # Winner fields
    draw_date = models.DateTimeField(blank=True, null=True)
    winner_ticket = models.PositiveIntegerField(blank=True, null=True)
    winner_name = models.CharField(max_length=200, blank=True, null=True)
    winner_email = models.EmailField(blank=True, null=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.create_tickets()
    
    def create_tickets(self):
        """Automatically create tickets when raffle is created"""
        tickets = []
        for i in range(1, self.total_tickets + 1):
            tickets.append(Ticket(raffle=self, number=i))
        Ticket.objects.bulk_create(tickets)
    
    @property
    def tickets_available(self):
        return self.tickets.filter(status='available').count()
    
    @property
    def tickets_sold(self):
        return self.tickets.filter(status='sold').count()
    
    def can_user_participate(self, user_location):
        """Check if user can participate based on location"""
        if self.scope == 'international':
            return True
        
        if not user_location:
            return False
        
        allowed_locations = self.allowed_locations.all()
        if not allowed_locations.exists():
            return True  # No restrictions
        
        for location in allowed_locations:
            if self.scope == 'provincial':
                if (location.state == user_location.get('state') and 
                    location.country == user_location.get('country')):
                    return True
            elif self.scope == 'national':
                if location.country == user_location.get('country'):
                    return True
        
        return False

class Ticket(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('reserved', 'Reserved'),
        ('sold', 'Sold'),
    ]
    
    raffle = models.ForeignKey(Raffle, on_delete=models.CASCADE, related_name='tickets')
    number = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    purchased_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    purchase_date = models.DateTimeField(null=True, blank=True)
    reserved_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['raffle', 'number']
        ordering = ['number']
    
    def __str__(self):
        return f"Ticket {self.number:03d} - {self.raffle.name}"
    
    def reserve_for_user(self, user, minutes=10):
        """Reserve ticket for user for specified minutes"""
        from django.utils import timezone
        self.status = 'reserved'
        self.reserved_until = timezone.now() + timedelta(minutes=minutes)
        self.save()
    
    def is_reservation_expired(self):
        """Check if reservation has expired"""
        from django.utils import timezone
        if self.reserved_until and timezone.now() > self.reserved_until:
            return True
        return False
    
    def release_reservation(self):
        """Release expired reservation"""
        if self.is_reservation_expired():
            self.status = 'available'
            self.reserved_until = None
            self.save()
            return True
        return False

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Cart for {self.user.email}"
    
    def get_total(self):
        return sum(item.ticket.raffle.ticket_price for item in self.items.all())
    
    def get_item_count(self):
        return self.items.count()

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['cart', 'ticket']
    
    def __str__(self):
        return f"{self.ticket} in cart"

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    order_number = models.CharField(max_length=20, unique=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=50, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    kushki_transaction_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.order_number} - {self.user.email}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"ORD-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.ticket} - ${self.price}"
