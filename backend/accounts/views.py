from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.core.mail import send_mail
from django.conf import settings
from .models import CustomUser, EmailVerification, PasswordReset
from .serializers import (
    CustomUserSerializer, UserRegistrationSerializer, UserLoginSerializer,
    EmailVerificationSerializer, ResendVerificationSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)

class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'Registration successful. Please check your email for verification code.',
            'email': user.email
        }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def user_login(request):
    serializer = UserLoginSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'user': CustomUserSerializer(user).data,
            'token': token.key,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def user_logout(request):
    try:
        request.user.auth_token.delete()
    except:
        pass
    logout(request)
    return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def verify_token(request):
    """Verifica si el token del usuario sigue siendo válido"""
    try:
        # Si llegamos aquí, el token es válido (pasó por IsAuthenticated)
        return Response({'valid': True}, status=status.HTTP_200_OK)
    except:
        return Response({'valid': False}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    serializer = CustomUserSerializer(request.user)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    serializer = CustomUserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_email(request):
    serializer = EmailVerificationSerializer(data=request.data)
    if serializer.is_valid():
        verification = serializer.validated_data['verification']
        user = CustomUser.objects.get(email=verification.email)
        
        # Mark verification as used and activate user
        verification.verified = True
        verification.save()
        
        user.is_active = True
        user.email_verified = True
        user.save()
        
        # Create token for immediate login
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Email verified successfully',
            'user': CustomUserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def resend_verification(request):
    serializer = ResendVerificationSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        user = CustomUser.objects.get(email=email, is_active=False)
        
        # Create new verification
        verification = EmailVerification.objects.create(email=email)
        
        try:
            send_mail(
                'Email Verification Code',
                f'Your verification code is: {verification.code}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return Response({
                'message': 'Verification code sent to your email'
            }, status=status.HTTP_200_OK)
        except Exception:
            verification.delete()
            return Response({
                'error': 'Failed to send email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        user = CustomUser.objects.get(email=email, is_active=True)
        
        # Create password reset
        reset = PasswordReset.objects.create(user=user)
        
        try:
            send_mail(
                'Password Reset Request',
                f'Click the link to reset your password: {settings.FRONTEND_URL}/reset-password/{reset.token}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return Response({
                'message': 'Password reset email sent'
            }, status=status.HTTP_200_OK)
        except Exception:
            reset.delete()
            return Response({
                'error': 'Failed to send email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        reset = serializer.validated_data['reset']
        password = serializer.validated_data['password']
        
        # Update password
        user = reset.user
        user.set_password(password)
        user.save()
        
        # Mark reset as used
        reset.used = True
        reset.save()
        
        return Response({
            'message': 'Password reset successfully'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
