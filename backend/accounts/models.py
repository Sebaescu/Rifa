from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
import random
import string

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email

class EmailVerification(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = ''.join(random.choices(string.digits, k=6))
        super().save(*args, **kwargs)
    
    def is_expired(self):
        # 15 minutes expiration
        return timezone.now() > (self.created_at + timedelta(minutes=15))
    
    def can_attempt(self):
        return self.attempts < 3
    
    class Meta:
        ordering = ['-created_at']

class PasswordReset(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if not self.token:
            self.token = ''.join(random.choices(string.ascii_letters + string.digits, k=50))
        super().save(*args, **kwargs)
    
    def is_expired(self):
        """Check if token is expired (1 hour from creation)"""
        return timezone.now() > (self.created_at + timedelta(hours=1))
    
    @property
    def email(self):
        """Get email from the related user"""
        return self.user.email
    
    class Meta:
        ordering = ['-created_at']
