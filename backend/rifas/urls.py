from django.urls import path
from . import views

app_name = 'rifas'

urlpatterns = [
    # Location URLs
    path('locations/', views.LocationListView.as_view(), name='location_list'),
    path('location/from-coordinates/', views.location_from_coordinates, name='location_from_coordinates'),
    path('location/by-ip/', views.location_by_ip, name='location_by_ip'),
    
    # Raffle URLs
    path('raffles/', views.RaffleListView.as_view(), name='raffle_list'),
    path('raffles/create/', views.RaffleCreateView.as_view(), name='raffle_create'),
    path('raffles/my-raffles/', views.UserRafflesView.as_view(), name='user_raffles'),
    path('raffles/<int:pk>/', views.RaffleDetailView.as_view(), name='raffle_detail'),
    path('raffles/<int:raffle_id>/tickets/', views.raffle_tickets, name='raffle_tickets'),
    path('raffles/<int:raffle_id>/sold-tickets/', views.raffle_sold_tickets, name='raffle_sold_tickets'),
    path('raffles/<int:raffle_id>/draw/', views.perform_raffle_draw, name='perform_raffle_draw'),
    
    # Cart URLs
    path('cart/', views.get_cart, name='get_cart'),
    path('cart/add/', views.add_to_cart, name='add_to_cart'),
    path('cart/add-raffle/', views.add_raffle_to_cart, name='add_raffle_to_cart'),
    path('cart/add-tickets/', views.add_tickets_to_cart, name='add_tickets_to_cart'),
    path('cart/remove/<int:ticket_id>/', views.remove_from_cart, name='remove_from_cart'),
    path('cart/clear/', views.clear_cart, name='clear_cart'),
    
    # Order URLs
    path('orders/', views.user_orders, name='user_orders'),
    path('orders/<int:order_id>/', views.order_detail, name='order_detail'),
    path('orders/checkout/', views.checkout, name='checkout'),
    
    # User tickets
    path('my-tickets/', views.user_tickets, name='user_tickets'),
    
    # Statistics
    path('statistics/', views.raffle_statistics, name='raffle_statistics'),
]
