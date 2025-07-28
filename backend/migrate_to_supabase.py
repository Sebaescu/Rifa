#!/usr/bin/env python
"""
Script para migrar datos de PostgreSQL local a Supabase
Ejecutar después de configurar Supabase
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rifa_project.settings')
django.setup()

def migrate_to_supabase():
    """
    Pasos para migrar a Supabase:
    1. Hacer backup de datos actuales
    2. Configurar variables de entorno para Supabase
    3. Ejecutar migraciones
    4. Importar datos (si es necesario)
    """
    
    print("🚀 Iniciando migración a Supabase...")
    
    # Verificar que DATABASE_URL esté configurada
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL no está configurada")
        print("Configura tu DATABASE_URL de Supabase en el archivo .env")
        return False
    
    print("✅ DATABASE_URL configurada")
    
    # Ejecutar migraciones
    print("📦 Ejecutando migraciones...")
    try:
        execute_from_command_line(['manage.py', 'migrate'])
        print("✅ Migraciones ejecutadas correctamente")
    except Exception as e:
        print(f"❌ Error en migraciones: {e}")
        return False
    
    # Crear superusuario si no existe
    print("👤 Verificando superusuario...")
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if not User.objects.filter(is_superuser=True).exists():
            print("No se encontró superusuario. Creando uno...")
            execute_from_command_line(['manage.py', 'createsuperuser'])
        else:
            print("✅ Superusuario ya existe")
    except Exception as e:
        print(f"⚠️  Advertencia en verificación de superusuario: {e}")
    
    print("🎉 Migración completada!")
    print("\n📋 Próximos pasos:")
    print("1. Verifica que tu aplicación funcione con Supabase")
    print("2. Actualiza las URLs del frontend para apuntar a tu backend en producción")
    print("3. Configura tu servidor de producción (Railway, Heroku, etc.)")
    print("4. Despliega tu frontend en GitHub Pages")
    
    return True

if __name__ == "__main__":
    success = migrate_to_supabase()
    sys.exit(0 if success else 1)
