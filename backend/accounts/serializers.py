from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import CustomUser, EmailVerification, PasswordReset

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'email_verified', 'date_joined']
        read_only_fields = ['id', 'email_verified', 'date_joined']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password_confirm', 
                 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = CustomUser.objects.create_user(**validated_data)
        user.is_active = False  # User must verify email first
        user.save()
        
        # Create email verification
        verification = EmailVerification.objects.create(
            email=user.email
        )
        
        # Send verification email
        self.send_verification_email(user, verification.code)
        
        return user
    
    def send_verification_email(self, user, code):
        subject = '🎟️ Verifica tu email - RifApp'
        
        # Contexto para el template
        context = {
            'user_name': user.first_name or user.username,
            'verification_code': code,
        }
        
        # Renderizar template HTML
        html_message = render_to_string('emails/email_verification.html', context)
        
        # Crear versión de texto plano como fallback
        text_message = f"""
¡Hola {user.first_name or user.username}!

Gracias por registrarte en RifApp.

Tu código de verificación es: {code}

Este código expira en 15 minutos.

Si no creaste esta cuenta, puedes ignorar este email.

Saludos,
Equipo RifApp
        """.strip()
        
        # Crear email con HTML y texto plano
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        email.attach_alternative(html_message, "text/html")
        email.send(fail_silently=False)

class EmailVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    
    def validate(self, attrs):
        email = attrs.get('email')
        code = attrs.get('code')
        
        try:
            verification = EmailVerification.objects.filter(
                email=email,
                code=code,
                verified=False
            ).latest('created_at')
            
            if verification.is_expired():
                raise serializers.ValidationError('Verification code has expired.')
            
            if not verification.can_attempt():
                raise serializers.ValidationError('Too many attempts. Please request a new code.')
            
            verification.attempts += 1
            verification.save()
            
            attrs['verification'] = verification
            return attrs
            
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError('Invalid verification code.')

class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            CustomUser.objects.get(email=value, is_active=False)
            return value
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('No unverified account found with this email.')

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            CustomUser.objects.get(email=value, is_active=True)
            return value
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('No active account found with this email.')

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(validators=[validate_password])
    password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        
        try:
            reset = PasswordReset.objects.get(
                token=attrs['token'],
                used=False
            )
            
            if reset.is_expired():
                raise serializers.ValidationError('Reset token has expired.')
            
            attrs['reset'] = reset
            return attrs
            
        except PasswordReset.DoesNotExist:
            raise serializers.ValidationError('Invalid or expired reset token.')

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            try:
                user = CustomUser.objects.get(email=email)
                
                if not user.is_active:
                    raise serializers.ValidationError('Account is not verified. Please check your email.')
                
                user = authenticate(request=self.context.get('request'),
                                  username=email, password=password)
                if not user:
                    raise serializers.ValidationError('Invalid credentials.')
                
                attrs['user'] = user
                return attrs
                
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials.')
        else:
            raise serializers.ValidationError('Must include email and password.')
