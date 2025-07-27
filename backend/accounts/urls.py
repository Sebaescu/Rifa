from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('verify-email/', views.verify_email, name='verify_email'),
    path('resend-verification/', views.resend_verification, name='resend_verification'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('verify-token/', views.verify_token, name='verify_token'),
    path('profile/', views.user_profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('password-reset/', views.password_reset_request, name='password_reset'),
    path('password-reset-confirm/', views.password_reset_confirm, name='password_reset_confirm'),
]
