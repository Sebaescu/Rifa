from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from .models import Raffle, Ticket, Cart, CartItem, Order, OrderItem, Location
from .serializers import (
    RaffleSerializer, RaffleCreateSerializer, RaffleDetailSerializer,
    TicketSerializer, CartSerializer, CartItemSerializer, AddToCartSerializer,
    OrderSerializer, CheckoutSerializer, LocationSerializer
)
import requests
import json

# Location Views
class LocationListView(generics.ListAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.AllowAny]

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def location_from_coordinates(request):
    """Get location info from coordinates using reverse geocoding"""
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')
    
    if not lat or not lng:
        return Response({'error': 'Latitude and longitude are required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Using a free geocoding service (you can replace with a better one)
        url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lng}&localityLanguage=es"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            return Response({
                'country': data.get('countryName', ''),
                'country_code': data.get('countryCode', ''),
                'state': data.get('principalSubdivision', ''),
                'city': data.get('city', '') or data.get('locality', ''),
                'latitude': float(lat),
                'longitude': float(lng)
            })
        else:
            return Response({'error': 'Failed to get location data'}, 
                           status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        return Response({'error': f'Geocoding service error: {str(e)}'}, 
                       status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def location_by_ip(request):
    """Get location info from IP address"""
    try:
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        # Use a free IP geolocation service
        url = f"http://ip-api.com/json/{ip}?lang=es"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                return Response({
                    'country': data.get('country', ''),
                    'country_code': data.get('countryCode', ''),
                    'state': data.get('regionName', ''),
                    'city': data.get('city', ''),
                    'latitude': data.get('lat'),
                    'longitude': data.get('lon')
                })
        
        # Fallback to Ecuador - Guayaquil
        return Response({
            'country': 'Ecuador',
            'country_code': 'EC',
            'state': 'Guayas',
            'city': 'Guayaquil',
            'latitude': -2.170998,
            'longitude': -79.922359
        })
    except Exception as e:
        # Fallback to Ecuador - Guayaquil
        return Response({
            'country': 'Ecuador',
            'country_code': 'EC',
            'state': 'Guayas',
            'city': 'Guayaquil',
            'latitude': -2.170998,
            'longitude': -79.922359
        })

# Raffle Views
class RaffleListView(generics.ListAPIView):
    serializer_class = RaffleSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Raffle.objects.filter(status='active')
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        # Add user location to context for distance calculations
        user_lat = self.request.query_params.get('user_lat')
        user_lng = self.request.query_params.get('user_lng')
        if user_lat and user_lng:
            context['user_lat'] = user_lat
            context['user_lng'] = user_lng
        return context

class RaffleCreateView(generics.CreateAPIView):
    queryset = Raffle.objects.all()
    serializer_class = RaffleCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        print(f"DEBUG: Request method: {request.method}")
        print(f"DEBUG: Content type: {request.content_type}")
        print(f"DEBUG: Request data: {request.data}")
        print(f"DEBUG: Request FILES: {request.FILES}")
        print(f"DEBUG: User authenticated: {request.user.is_authenticated}")
        print(f"DEBUG: User: {request.user}")
        
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"DEBUG: Exception in create: {e}")
            print(f"DEBUG: Exception type: {type(e)}")
            import traceback
            traceback.print_exc()
            raise

class RaffleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Raffle.objects.all()
    serializer_class = RaffleDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_update(self, serializer):
        # Only allow owner to update
        if self.get_object().created_by != self.request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only allow owner to delete
        if instance.created_by != self.request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        instance.delete()

class UserRafflesView(generics.ListAPIView):
    """Get raffles created by the current user"""
    serializer_class = RaffleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Raffle.objects.filter(created_by=self.request.user).order_by('-created_at')

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def raffle_tickets(request, raffle_id):
    """Get all tickets for a specific raffle with their availability status"""
    raffle = get_object_or_404(Raffle, id=raffle_id)
    tickets = raffle.tickets.all()
    
    # Release any expired reservations
    for ticket in tickets.filter(status='reserved'):
        ticket.release_reservation()
    
    serializer = TicketSerializer(tickets, many=True)
    return Response(serializer.data)

# Cart Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_cart(request):
    """Get user's cart"""
    cart, created = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_to_cart(request):
    """Add ticket to cart and reserve it"""
    serializer = AddToCartSerializer(data=request.data)
    if serializer.is_valid():
        ticket_id = serializer.validated_data['ticket_id']
        ticket = get_object_or_404(Ticket, id=ticket_id)
        
        # Check if ticket is available
        if ticket.status != 'available':
            return Response({
                'error': 'Ticket is not available'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create cart
        cart, created = Cart.objects.get_or_create(user=request.user)
        
        # Check if ticket already in cart
        if CartItem.objects.filter(cart=cart, ticket=ticket).exists():
            return Response({
                'error': 'Ticket already in cart'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Reserve ticket and add to cart
        with transaction.atomic():
            ticket.reserve_for_user(request.user, minutes=10)
            CartItem.objects.create(cart=cart, ticket=ticket)
        
        return Response({
            'message': 'Ticket added to cart and reserved for 10 minutes'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_from_cart(request, ticket_id):
    """Remove ticket from cart and release reservation"""
    cart = get_object_or_404(Cart, user=request.user)
    ticket = get_object_or_404(Ticket, id=ticket_id)
    
    try:
        cart_item = CartItem.objects.get(cart=cart, ticket=ticket)
        
        with transaction.atomic():
            # Release reservation
            if ticket.status == 'reserved':
                ticket.status = 'available'
                ticket.reserved_until = None
                ticket.save()
            
            # Remove from cart
            cart_item.delete()
        
        return Response({
            'message': 'Ticket removed from cart'
        }, status=status.HTTP_200_OK)
        
    except CartItem.DoesNotExist:
        return Response({
            'error': 'Ticket not in cart'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def clear_cart(request):
    """Clear entire cart and release all reservations"""
    try:
        cart = Cart.objects.get(user=request.user)
        
        with transaction.atomic():
            # Release all reservations
            for item in cart.items.all():
                if item.ticket.status == 'reserved':
                    item.ticket.status = 'available'
                    item.ticket.reserved_until = None
                    item.ticket.save()
            
            # Clear cart
            cart.items.all().delete()
        
        return Response({
            'message': 'Cart cleared'
        }, status=status.HTTP_200_OK)
        
    except Cart.DoesNotExist:
        return Response({
            'message': 'Cart is already empty'
        }, status=status.HTTP_200_OK)

# Order Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_orders(request):
    """Get user's order history"""
    orders = Order.objects.filter(user=request.user)
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_detail(request, order_id):
    """Get specific order details"""
    order = get_object_or_404(Order, id=order_id, user=request.user)
    serializer = OrderSerializer(order)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def checkout(request):
    """Convert cart to order"""
    serializer = CheckoutSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        try:
            cart = Cart.objects.get(user=request.user)
            
            if not cart.items.exists():
                return Response({
                    'error': 'Cart is empty'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if all tickets are still reserved and valid
            for item in cart.items.all():
                if item.ticket.status != 'reserved':
                    return Response({
                        'error': f'Ticket {item.ticket.number} is no longer available'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                if item.ticket.is_reservation_expired():
                    return Response({
                        'error': f'Reservation for ticket {item.ticket.number} has expired'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create order
            with transaction.atomic():
                order = Order.objects.create(
                    user=request.user,
                    total_amount=cart.get_total(),
                    payment_method=serializer.validated_data['payment_method']
                )
                
                # Create order items and mark tickets as sold
                for item in cart.items.all():
                    OrderItem.objects.create(
                        order=order,
                        ticket=item.ticket,
                        price=item.ticket.raffle.ticket_price
                    )
                    
                    # Mark ticket as sold
                    item.ticket.status = 'sold'
                    item.ticket.purchased_by = request.user
                    item.ticket.purchase_date = timezone.now()
                    item.ticket.reserved_until = None
                    item.ticket.save()
                
                # Clear cart
                cart.items.all().delete()
            
            return Response({
                'order': OrderSerializer(order).data,
                'message': 'Order created successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Cart.DoesNotExist:
            return Response({
                'error': 'Cart does not exist'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_tickets(request):
    """Get all tickets owned by user, grouped by raffle"""
    tickets = Ticket.objects.filter(purchased_by=request.user).select_related('raffle')
    
    # Group tickets by raffle
    raffles_data = {}
    for ticket in tickets:
        raffle_name = ticket.raffle.name
        if raffle_name not in raffles_data:
            raffles_data[raffle_name] = {
                'raffle': RaffleSerializer(ticket.raffle).data,
                'tickets': []
            }
        raffles_data[raffle_name]['tickets'].append(TicketSerializer(ticket).data)
    
    return Response(list(raffles_data.values()))
