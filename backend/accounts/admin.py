from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib import messages
from django.urls import reverse
from django.utils.html import format_html
from .models import CustomUser, EmailVerification, PasswordReset

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'is_active', 'email_verified', 'date_joined', 'delete_link']
    list_filter = ['is_active', 'is_staff', 'email_verified', 'date_joined']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    actions = ['delete_selected', 'force_delete_users']  # Enable bulk delete
    
    fieldsets = UserAdmin.fieldsets + (
        ('Email Verification', {'fields': ('email_verified',)}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('email', 'email_verified')}),
    )
    
    def delete_link(self, obj):
        """Add a delete link for each user in the list view"""
        delete_url = reverse("admin:accounts_customuser_delete", args=[obj.pk])
        return format_html('<a href="{}" class="deletelink">Delete</a>', delete_url)
    delete_link.short_description = "Delete"
    delete_link.allow_tags = True
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion for all users"""
        return request.user.is_superuser  # Only superusers can delete
    
    def has_change_permission(self, request, obj=None):
        """Allow changes"""
        return True
    
    def get_actions(self, request):
        """Ensure delete actions are available"""
        actions = super().get_actions(request)
        if 'delete_selected' not in actions and request.user.is_superuser:
            actions['delete_selected'] = self.get_action('delete_selected')
        return actions
    
    def delete_model(self, request, obj):
        """Custom delete method for individual user deletion"""
        try:
            # Delete related objects first to avoid conflicts
            obj.raffle_set.all().delete()  # Delete raffles created by user
            obj.order_set.all().delete()   # Delete orders by user
            if hasattr(obj, 'cart'):
                obj.cart.delete()          # Delete user's cart
            obj.delete()                   # Finally delete the user
            messages.success(request, f"User {obj.email} and all related data deleted successfully.")
        except Exception as e:
            messages.error(request, f"Error deleting user {obj.email}: {str(e)}")
    
    def force_delete_users(self, request, queryset):
        """Custom action to force delete users with all related objects"""
        count = 0
        for user in queryset:
            try:
                # Delete related objects first to avoid conflicts
                user.raffle_set.all().delete()  # Delete raffles created by user
                user.order_set.all().delete()   # Delete orders by user
                if hasattr(user, 'cart'):
                    user.cart.delete()          # Delete user's cart
                user.delete()                   # Finally delete the user
                count += 1
            except Exception as e:
                messages.error(request, f"Error deleting user {user.email}: {str(e)}")
        
        if count > 0:
            messages.success(request, f"Successfully deleted {count} user(s) and their related data.")
        
    force_delete_users.short_description = "Force delete selected users and all related data"

@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ['email', 'code', 'verified', 'attempts', 'created_at']
    list_filter = ['verified', 'created_at']
    search_fields = ['email', 'code']
    readonly_fields = ['code', 'created_at']

@admin.register(PasswordReset)
class PasswordResetAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'used', 'created_at']
    list_filter = ['used', 'created_at']
    search_fields = ['user__email', 'user__username', 'token']
    readonly_fields = ['token', 'created_at']
