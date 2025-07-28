from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import random
import requests
import json
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
        user_lat = self.request.query_params.get('user_lat')
        user_lng = self.request.query_params.get('user_lng')
        
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        # Filter raffles based on user location if provided
        if user_lat and user_lng:
            queryset = self.filter_by_user_location(queryset, float(user_lat), float(user_lng))
        
        return queryset
    
    def filter_by_user_location(self, queryset, user_lat, user_lng):
        """Filter raffles based on user's location and raffle scope/allowed_locations"""
        try:
            # Get user's location details using reverse geocoding
            url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={user_lat}&longitude={user_lng}&localityLanguage=es"
            response = requests.get(url, timeout=5)
            
            if response.status_code != 200:
                return queryset
            
            location_data = response.json()
            user_country = location_data.get('countryName', '')
            user_country_code = location_data.get('countryCode', '')
            user_state = location_data.get('principalSubdivision', '')
            
            
            filtered_raffle_ids = []
            
            for raffle in queryset:
                should_include = False
                
                if raffle.scope == 'international':
                    # For international raffles, check if user's country is in allowed_locations
                    if not raffle.allowed_locations.exists():
                        # No restrictions, include all
                        should_include = True
                    else:
                        # Check if user's country is in allowed locations
                        for location in raffle.allowed_locations.all():
                            if (location.country == user_country or 
                                location.country_code == user_country_code):
                                should_include = True
                                break
                
                elif raffle.scope == 'national':
                    # For national raffles, check if user is in the same country
                    if raffle.allowed_locations.exists():
                        for location in raffle.allowed_locations.all():
                            if (location.country == user_country or 
                                location.country_code == user_country_code):
                                should_include = True
                                break
                    else:
                        # No restrictions, include for same country users
                        should_include = True
                
                elif raffle.scope == 'provincial':
                    # For provincial raffles, check if user is in the same state/province
                    if raffle.allowed_locations.exists():
                        for location in raffle.allowed_locations.all():
                            if location.state == user_state:
                                should_include = True
                                break
                    else:
                        # No restrictions, include for same state users
                        should_include = True
                
                if should_include:
                    filtered_raffle_ids.append(raffle.id)
                    
            return queryset.filter(id__in=filtered_raffle_ids)
            
        except Exception as e:
            # If there's an error, return all raffles
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
        
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
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
        raffle = self.get_object()
        
        # Only allow owner to update
        if raffle.created_by != self.request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # Only allow editing if raffle is inactive
        if raffle.status != 'inactive':
            return Response({
                'error': 'Solo se pueden editar rifas que están inactivas (que aún no han comenzado)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only allow owner to delete
        if instance.created_by != self.request.user:
            raise PermissionDenied('No tienes permisos para eliminar esta rifa')
        
        # Only allow deletion of inactive raffles (that haven't started yet)
        now = timezone.now()
        
        if instance.start_date <= now:
            raise ValidationError('Solo se pueden eliminar rifas que aún no han comenzado')
        
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

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_raffle_to_cart(request):
    """Add first available ticket from a raffle to cart"""
    raffle_id = request.data.get('raffle_id')
    if not raffle_id:
        return Response({
            'error': 'raffle_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    raffle = get_object_or_404(Raffle, id=raffle_id)
    
    # Find first available ticket for this raffle
    available_ticket = Ticket.objects.filter(
        raffle=raffle, 
        status='available'
    ).first()
    
    if not available_ticket:
        return Response({
            'error': 'No tickets available for this raffle'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get or create cart
    cart, created = Cart.objects.get_or_create(user=request.user)
    
    # Check if user already has a ticket from this raffle in cart
    existing_item = CartItem.objects.filter(
        cart=cart, 
        ticket__raffle=raffle
    ).first()
    
    if existing_item:
        return Response({
            'error': 'You already have a ticket from this raffle in your cart'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Reserve ticket and add to cart
    with transaction.atomic():
        available_ticket.reserve_for_user(request.user, minutes=10)
        CartItem.objects.create(cart=cart, ticket=available_ticket)
    
    return Response({
        'message': f'Ticket #{available_ticket.number} from "{raffle.name}" added to cart',
        'ticket_number': available_ticket.number
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_tickets_to_cart(request):
    """Add multiple specific tickets to cart"""
    ticket_ids = request.data.get('ticket_ids', [])
    
    if not ticket_ids or not isinstance(ticket_ids, list):
        return Response({
            'error': 'ticket_ids must be a non-empty list'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get or create cart
    cart, created = Cart.objects.get_or_create(user=request.user)
    
    added_tickets = []
    errors = []
    
    with transaction.atomic():
        for ticket_id in ticket_ids:
            try:
                ticket = Ticket.objects.get(id=ticket_id, status='available')
                
                # Check if ticket is already in cart
                existing_item = CartItem.objects.filter(
                    cart=cart, 
                    ticket=ticket
                ).first()
                
                if existing_item:
                    errors.append(f'Ticket #{ticket.number} is already in your cart')
                    continue
                
                # Reserve ticket and add to cart
                ticket.reserve_for_user(request.user, minutes=10)
                CartItem.objects.create(cart=cart, ticket=ticket)
                added_tickets.append({
                    'ticket_id': ticket.id,
                    'ticket_number': ticket.number,
                    'raffle_name': ticket.raffle.name
                })
                
            except Ticket.DoesNotExist:
                errors.append(f'Ticket with ID {ticket_id} is not available')
    
    if added_tickets:
        response_data = {
            'message': f'{len(added_tickets)} ticket(s) added to cart',
            'added_tickets': added_tickets
        }
        if errors:
            response_data['warnings'] = errors
        return Response(response_data, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'error': 'No tickets could be added to cart',
            'details': errors
        }, status=status.HTTP_400_BAD_REQUEST)

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
            cart, created = Cart.objects.get_or_create(user=request.user)
            if created:
                return Response({
                    'error': 'Cart was empty'
                }, status=status.HTTP_400_BAD_REQUEST)
            
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
            
        except Exception as e:
            return Response({
                'error': f'An error occurred: {str(e)}'
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

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def raffle_statistics(request):
    """Get general raffle statistics"""
    try:
        total_active_raffles = Raffle.objects.filter(status='active').count()
        total_raffles = Raffle.objects.count()
        total_tickets_sold = Ticket.objects.count()
        
        return Response({
            'total_active_raffles': total_active_raffles,
            'total_raffles': total_raffles,
            'total_tickets_sold': total_tickets_sold
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def send_winner_notification_email(raffle, winner_user, winning_ticket_number):
    """Send notification email to the raffle winner"""
    try:
        # Format the draw date
        draw_date_formatted = raffle.draw_date.strftime("%d de %B de %Y a las %H:%M")
        
        # Prepare context for the email template
        context = {
            'winner_name': raffle.winner_name,
            'raffle_name': raffle.name,
            'winning_ticket': winning_ticket_number,
            'draw_date': draw_date_formatted,
            'organizer_name': f"{raffle.created_by.first_name} {raffle.created_by.last_name}".strip() or raffle.created_by.username,
            'organizer_email': raffle.created_by.email,
        }
        
        # Render the HTML email template
        html_message = render_to_string('emails/winner_notification.html', context)
        
        # Email subject
        subject = f'🎉 ¡Felicidades! Ganaste la rifa: {raffle.name}'
        
        # Send the email
        send_mail(
            subject=subject,
            message='',  # Plain text version (empty since we're using HTML)
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[winner_user.email],
            html_message=html_message,
            fail_silently=False
        )
        
        return True
        
    except Exception as e:
        return False

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def perform_raffle_draw(request, raffle_id):
    """Perform the raffle draw and select a winner from sold tickets"""
    import random
    from django.utils import timezone
    
    try:
        raffle = get_object_or_404(Raffle, id=raffle_id)
        
        
        # Check if user is the creator of the raffle
        if raffle.created_by != request.user:
            return Response({
                'error': 'You are not authorized to perform this draw'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if raffle is active
        if raffle.status != 'active':
            return Response({
                'error': 'Raffle is not active'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if raffle has ended
        if timezone.now() <= raffle.end_date:
            return Response({
                'error': 'Raffle has not ended yet'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all sold tickets
        sold_tickets = Ticket.objects.filter(
            raffle=raffle, 
            status='sold',
            purchased_by__isnull=False
        ).select_related('purchased_by')
        
        for ticket in sold_tickets:
            pass  # Process tickets if needed
        
        if not sold_tickets.exists():
            return Response({
                'error': 'No sold tickets available for draw'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Select a random winner
        winning_ticket = random.choice(sold_tickets)
        winner_user = winning_ticket.purchased_by
        
        
        # Update raffle with winner information
        raffle.draw_date = timezone.now()
        raffle.winner_ticket = winning_ticket.number
        raffle.winner_name = f"{winner_user.first_name} {winner_user.last_name}".strip() or winner_user.username
        raffle.winner_email = winner_user.email
        
        
        raffle.save()
        
        
        # Send winner notification email
        email_sent = send_winner_notification_email(raffle, winner_user, winning_ticket.number)
        
        return Response({
            'winner_ticket': winning_ticket.number,
            'winner_name': raffle.winner_name,
            'winner_email': raffle.winner_email,
            'draw_date': raffle.draw_date.isoformat(),
            'email_sent': email_sent
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'An error occurred during the draw: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def raffle_sold_tickets(request, raffle_id):
    """Get all sold tickets for a specific raffle"""
    raffle = get_object_or_404(Raffle, id=raffle_id)
    sold_tickets = Ticket.objects.filter(
        raffle=raffle, 
        status='sold',
        purchased_by__isnull=False
    ).select_related('purchased_by')
    
    serializer = TicketSerializer(sold_tickets, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def activate_raffles_starting_today(request):
    today = request.data.get('today')
    if not today:
        return Response({'error': 'Missing today parameter'}, status=status.HTTP_400_BAD_REQUEST)
    from .models import Raffle
    updated = Raffle.objects.filter(status='inactive', start_date__date=today).update(status='active')
    return Response({'activated': updated})
