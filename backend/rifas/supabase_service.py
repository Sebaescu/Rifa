from supabase import create_client, Client
from django.conf import settings
import os

class SupabaseService:
    """
    Servicio para interactuar con Supabase
    Útil para funcionalidades como almacenamiento de archivos, funciones edge, etc.
    """
    
    def __init__(self):
        url = settings.SUPABASE_URL or os.getenv('SUPABASE_URL')
        key = settings.SUPABASE_ANON_KEY or os.getenv('SUPABASE_ANON_KEY')
        
        if url and key:
            self.supabase: Client = create_client(url, key)
        else:
            self.supabase = None
            print("Warning: Supabase credentials not configured")
    
    def is_configured(self):
        """Verificar si Supabase está configurado"""
        return self.supabase is not None
    
    def upload_file(self, bucket_name: str, file_path: str, file_data: bytes):
        """
        Subir archivo a Supabase Storage
        """
        if not self.is_configured():
            return None
        
        try:
            response = self.supabase.storage.from_(bucket_name).upload(file_path, file_data)
            return response
        except Exception as e:
            print(f"Error uploading file to Supabase: {e}")
            return None
    
    def get_public_url(self, bucket_name: str, file_path: str):
        """
        Obtener URL pública de un archivo
        """
        if not self.is_configured():
            return None
        
        try:
            response = self.supabase.storage.from_(bucket_name).get_public_url(file_path)
            return response
        except Exception as e:
            print(f"Error getting public URL: {e}")
            return None
    
    def delete_file(self, bucket_name: str, file_path: str):
        """
        Eliminar archivo de Supabase Storage
        """
        if not self.is_configured():
            return None
        
        try:
            response = self.supabase.storage.from_(bucket_name).remove([file_path])
            return response
        except Exception as e:
            print(f"Error deleting file: {e}")
            return None

# Instancia global del servicio
supabase_service = SupabaseService()
