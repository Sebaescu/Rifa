from rest_framework import serializers
from .models import Raffle, Ticket, Cart, CartItem, Order, OrderItem, Location
from accounts.serializers import CustomUserSerializer
import math
import json
import base64
from django.core.files.base import ContentFile

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'country', 'country_code', 'state', 'city', 'zip_code', 
                 'latitude', 'longitude']

class TicketSerializer(serializers.ModelSerializer):
    buyer = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = ['id', 'number', 'status', 'purchased_by', 'purchase_date', 
                 'reserved_until', 'created_at', 'buyer']
        read_only_fields = ['id', 'purchased_by', 'purchase_date', 'created_at']
    
    def get_buyer(self, obj):
        if obj.purchased_by:
            return {
                'id': obj.purchased_by.id,
                'username': obj.purchased_by.username,
                'email': obj.purchased_by.email,
                'first_name': obj.purchased_by.first_name,
                'last_name': obj.purchased_by.last_name
            }
        return None

class TicketWithRaffleSerializer(serializers.ModelSerializer):
    raffle = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = ['id', 'number', 'status', 'purchased_by', 'purchase_date', 
                 'reserved_until', 'created_at', 'raffle']
        read_only_fields = ['id', 'purchased_by', 'purchase_date', 'created_at']
    
    def get_raffle(self, obj):
        # Crear un serializer de rifa simplificado para evitar recursión
        return {
            'id': obj.raffle.id,
            'name': obj.raffle.name,
            'description': obj.raffle.description,
            'ticket_price': obj.raffle.ticket_price,
            'image': obj.raffle.image.url if obj.raffle.image else None,
            'scope': obj.raffle.scope,
            'tickets_available': obj.raffle.tickets_available,
        }

class RaffleSerializer(serializers.ModelSerializer):
    created_by = CustomUserSerializer(read_only=True)
    tickets_available = serializers.SerializerMethodField()
    tickets_sold = serializers.SerializerMethodField()
    allowed_locations = LocationSerializer(many=True, read_only=True)
    distance_km = serializers.SerializerMethodField()
    
    class Meta:
        model = Raffle
        fields = ['id', 'name', 'description', 'ticket_price', 'total_tickets',
                 'start_date', 'end_date', 'status', 'created_by', 'created_at',
                 'updated_at', 'image', 'terms_conditions', 'tickets_available', 
                 'tickets_sold', 'scope', 'allowed_locations', 'distance_km',
                 'draw_date', 'winner_ticket', 'winner_name', 'winner_email']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_tickets_available(self, obj):
        return obj.tickets.filter(status='available').count()
    
    def get_tickets_sold(self, obj):
        return obj.tickets.filter(status='sold').count()
    
    def get_distance_km(self, obj):
        """Calculate distance from user location to raffle location"""
        user_lat = self.context.get('user_lat')
        user_lng = self.context.get('user_lng')
        
        if not user_lat or not user_lng:
            return None
        
        # Get the closest location for this raffle
        closest_distance = None
        for location in obj.allowed_locations.all():
            if location.latitude and location.longitude:
                distance = self.calculate_distance(
                    float(user_lat), float(user_lng),
                    float(location.latitude), float(location.longitude)
                )
                if closest_distance is None or distance < closest_distance:
                    closest_distance = distance
        
        return closest_distance
    
    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two points using Haversine formula"""
        R = 6371  # Earth's radius in kilometers
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat/2) * math.sin(dlat/2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon/2) * math.sin(dlon/2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return round(distance, 2)

class RaffleCreateSerializer(serializers.ModelSerializer):
    allowed_locations = serializers.ListField(write_only=True, required=False)
    image_base64 = serializers.CharField(write_only=True, required=False)
    image_name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Raffle
        fields = ['name', 'description', 'ticket_price', 'total_tickets',
                 'start_date', 'end_date', 'image', 'terms_conditions', 
                 'scope', 'allowed_locations', 'image_base64', 'image_name']
    
    def create(self, validated_data):
        from django.utils import timezone
        
        
        allowed_locations_data = validated_data.pop('allowed_locations', [])
        image_base64 = validated_data.pop('image_base64', None)
        image_name = validated_data.pop('image_name', None)
        
        
        # Determine status based on start_date
        start_date = validated_data.get('start_date')
        now = timezone.now()
        
        if start_date and start_date > now:
            validated_data['status'] = 'inactive'  # Starts in the future
        else:
            validated_data['status'] = 'active'    # Starts now or in the past
        
        # Process base64 image if provided
        if image_base64 and image_name:
            try:
                # Extract the base64 content (remove data:image/...;base64, prefix)
                format, imgstr = image_base64.split(';base64,')
                ext = format.split('/')[-1]
                
                # Create Django file from base64
                image_data = base64.b64decode(imgstr)
                validated_data['image'] = ContentFile(image_data, name=image_name)
            except Exception as e:
                print(f"ERROR processing image: {e}")
                import traceback
                traceback.print_exc()
        else:
            pass  # No image data provided
        
        validated_data['created_by'] = self.context['request'].user
        
        raffle = super().create(validated_data)
        
        # Process allowed_locations from frontend
        if allowed_locations_data:
            locations = []
            for location_data in allowed_locations_data:
                location, created = Location.objects.get_or_create(
                    country=location_data.get('country_name', ''),
                    country_code=location_data.get('country_code', ''),
                    state=location_data.get('state_name', '') if location_data.get('type') == 'state' else '',
                    defaults={
                        'city': '',  # No city for country/state level
                    }
                )
                locations.append(location)
            
            raffle.allowed_locations.set(locations)
        
        return raffle

    def update(self, instance, validated_data):
        from django.utils import timezone
        
        
        allowed_locations_data = validated_data.pop('allowed_locations', [])
        image_base64 = validated_data.pop('image_base64', None)
        image_name = validated_data.pop('image_name', None)
        
        # Determine status based on start_date
        start_date = validated_data.get('start_date', instance.start_date)
        now = timezone.now()
        
        if start_date and start_date > now:
            validated_data['status'] = 'inactive'  # Starts in the future
        else:
            validated_data['status'] = 'active'    # Starts now or in the past
        
        # Process base64 image if provided
        if image_base64 and image_name:
            try:
                # Extract the base64 content (remove data:image/...;base64, prefix)
                format, imgstr = image_base64.split(';base64,')
                ext = format.split('/')[-1]
                
                # Create Django file from base64
                image_data = base64.b64decode(imgstr)
                validated_data['image'] = ContentFile(image_data, name=image_name)
            except Exception as e:
                print(f"ERROR processing image for update: {e}")
                import traceback
                traceback.print_exc()
        
        # Update the raffle
        raffle = super().update(instance, validated_data)
        
        # Process allowed_locations from frontend
        if allowed_locations_data:
            locations = []
            for location_data in allowed_locations_data:
                location, created = Location.objects.get_or_create(
                    country=location_data.get('country_name', ''),
                    country_code=location_data.get('country_code', ''),
                    state=location_data.get('state_name', '') if location_data.get('type') == 'state' else '',
                    defaults={
                        'city': '',  # No city for country/state level
                    }
                )
                locations.append(location)
            
            raffle.allowed_locations.set(locations)
        
        return raffle

class RaffleDetailSerializer(serializers.ModelSerializer):
    created_by = CustomUserSerializer(read_only=True)
    tickets = TicketSerializer(many=True, read_only=True)
    tickets_available = serializers.SerializerMethodField()
    tickets_sold = serializers.SerializerMethodField()
    allowed_locations = LocationSerializer(many=True, read_only=True)
    
    class Meta:
        model = Raffle
        fields = ['id', 'name', 'description', 'ticket_price', 'total_tickets',
                 'start_date', 'end_date', 'status', 'created_by', 'created_at',
                 'updated_at', 'image', 'terms_conditions', 'tickets', 
                 'tickets_available', 'tickets_sold', 'scope', 'allowed_locations',
                 'draw_date', 'winner_ticket', 'winner_name', 'winner_email']
    
    def get_tickets_available(self, obj):
        return obj.tickets.filter(status='available').count()
    
    def get_tickets_sold(self, obj):
        return obj.tickets.filter(status='sold').count()

class CartItemSerializer(serializers.ModelSerializer):
    ticket = TicketWithRaffleSerializer(read_only=True)
    ticket_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'ticket', 'ticket_id', 'added_at']
        read_only_fields = ['id', 'added_at']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total_amount', 'item_count', 
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_total_amount(self, obj):
        return obj.get_total()
    
    def get_item_count(self, obj):
        return obj.get_item_count()

class AddToCartSerializer(serializers.Serializer):
    ticket_id = serializers.IntegerField()
    
    def validate_ticket_id(self, value):
        try:
            ticket = Ticket.objects.get(id=value)
            if ticket.status != 'available':
                raise serializers.ValidationError("Ticket is not available.")
            return value
        except Ticket.DoesNotExist:
            raise serializers.ValidationError("Ticket does not exist.")

class OrderItemSerializer(serializers.ModelSerializer):
    ticket = TicketSerializer(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'ticket', 'price', 'created_at']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = CustomUserSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'order_number', 'total_amount', 'status',
                 'payment_method', 'payment_reference', 'kushki_transaction_id',
                 'created_at', 'updated_at', 'completed_at', 'items']
        read_only_fields = ['id', 'order_number', 'created_at', 'updated_at']

class CheckoutSerializer(serializers.Serializer):
    payment_method = serializers.CharField(max_length=50)
    
    def validate(self, attrs):
        user = self.context['request'].user
        # Use get_or_create as a safety measure
        cart, created = Cart.objects.get_or_create(user=user)
        if created:
            print(f"Cart created during checkout for user: {user.email}")
        
        if not cart.items.exists():
            raise serializers.ValidationError("Cart is empty.")
        return attrs
