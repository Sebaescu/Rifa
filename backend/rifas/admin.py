from django.contrib import admin
from .models import Raffle, Ticket, Cart, CartItem, Order, OrderItem

@admin.register(Raffle)
class RaffleAdmin(admin.ModelAdmin):
    list_display = ['name', 'ticket_price', 'total_tickets', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'created_at', 'start_date', 'end_date']
    search_fields = ['name', 'description', 'created_by__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'ticket_price', 'total_tickets')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date')
        }),
        ('Settings', {
            'fields': ('status', 'image', 'terms_conditions')
        }),
        ('Meta', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['raffle', 'number', 'status', 'purchased_by', 'purchase_date']
    list_filter = ['status', 'raffle', 'purchase_date']
    search_fields = ['raffle__name', 'number', 'purchased_by__email']
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('raffle', 'purchased_by')

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'item_count', 'total_amount', 'created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    def item_count(self, obj):
        return obj.get_item_count()
    item_count.short_description = 'Items in Cart'
    
    def total_amount(self, obj):
        return f"${obj.get_total():.2f}"
    total_amount.short_description = 'Total Amount'

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'ticket', 'added_at']
    list_filter = ['added_at']
    readonly_fields = ['added_at']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['order_number', 'user__email', 'payment_reference']
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('user', 'order_number', 'total_amount', 'status')
        }),
        ('Payment Info', {
            'fields': ('payment_method', 'payment_reference', 'kushki_transaction_id')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at', 'completed_at')
        }),
    )

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'ticket', 'price', 'created_at']
    list_filter = ['created_at']
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order', 'ticket', 'ticket__raffle')
