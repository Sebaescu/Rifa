# Migración a Supabase - Guía Completa

## 📋 Configuración en Supabase

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Haz clic en "New Project"
3. Elige tu organización y configura:
   - **Project Name**: `rifa-system`
   - **Database Password**: Genera una contraseña segura (guárdala)
   - **Region**: Elige la más cercana a tus usuarios
4. Espera a que se cree el proyecto (2-3 minutos)

### 2. Obtener Credenciales

Una vez creado el proyecto:

#### Database Connection:
1. Ve a **Settings > Database**
2. Copia la **Connection string** en el formato:
   ```
   postgresql://postgres.PROYECTO_ID:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
   ```

#### API Keys:
1. Ve a **Settings > API**
2. Copia:
   - **Project URL**: `https://tu_proyecto_id.supabase.co`
   - **anon public key**: Para el frontend
   - **service_role key**: Para el backend (¡mantener secreto!)

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` con:

```env
# Django Settings
SECRET_KEY=tu-secret-key-super-segura-aqui-genera-una-nueva
DEBUG=False
ALLOWED_HOSTS=tu-dominio-backend.com,localhost,127.0.0.1

# Database - Supabase
DATABASE_URL=postgresql://postgres.tu_proyecto_id:tu_password@aws-0-region.pooler.supabase.com:5432/postgres

# Supabase API
SUPABASE_URL=https://tu_proyecto_id.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Email Configuration (Gmail ejemplo)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu_email@gmail.com
EMAIL_HOST_PASSWORD=tu_app_password_gmail
DEFAULT_FROM_EMAIL=tu_email@gmail.com
SERVER_EMAIL=tu_email@gmail.com

# Frontend URL
FRONTEND_URL=https://tu-usuario.github.io/tu-repositorio
```

## 🚀 Migración Paso a Paso

### 1. Instalar Nuevas Dependencias

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurar Variables de Entorno

```bash
# Copia el archivo de ejemplo y editalo
cp .env.production .env
# Edita .env con tus valores reales de Supabase
```

### 3. Ejecutar Migración

```bash
# Ejecutar el script de migración
python migrate_to_supabase.py
```

O manualmente:
```bash
# Aplicar migraciones a Supabase
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Recopilar archivos estáticos (si usas)
python manage.py collectstatic --noinput
```

### 4. Verificar Conexión

```bash
# Probar que funciona
python manage.py shell
```

En el shell de Django:
```python
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT version()")
print(cursor.fetchone())
```

## 🌐 Despliegue del Backend

Supabase es solo la base de datos. Necesitas desplegar tu backend Django en:

### Opciones Recomendadas:

1. **Railway** (Recomendado - Simple y gratuito para empezar)
   - Ve a [railway.app](https://railway.app)
   - Conecta tu repositorio de GitHub
   - Railway detectará automáticamente Django
   - Configura las variables de entorno en Railway

2. **Heroku**
   - Requiere configuración adicional
   - Agregar `Procfile`

3. **DigitalOcean App Platform**
   - Similar a Railway

4. **Vercel** (Para APIs simples)

### Configuración para Railway:

1. Conecta tu repo de GitHub
2. Selecciona la carpeta `backend/`
3. Configura las variables de entorno:
   ```
   DATABASE_URL=tu_connection_string_de_supabase
   SECRET_KEY=tu_secret_key
   DEBUG=False
   ALLOWED_HOSTS=tu-app.railway.app
   (y todas las demás del .env)
   ```

## 📱 Configuración del Frontend

### 1. Actualizar URL del API

En `frontend/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-backend-railway.app/api/', // URL de tu backend desplegado
  locationApiKey: 'tu_api_key'
};
```

### 2. Configurar CORS en Backend

En `settings.py`, actualiza:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "http://127.0.0.1:4200", 
    "https://tu-usuario.github.io",  # Tu GitHub Pages
]
```

## 🔧 Comandos Útiles

### Backup de Datos Locales (antes de migrar):
```bash
# Hacer dump de la base local
python manage.py dumpdata > backup.json

# Restaurar datos en Supabase (después de migrar)
python manage.py loaddata backup.json
```

### Verificar Configuración:
```bash
# Verificar configuración de base de datos
python manage.py check --database default

# Probar conexión
python manage.py dbshell
```

## 🛠️ Troubleshooting

### Error de Conexión:
- Verifica que DATABASE_URL esté correcta
- Asegúrate de que tu IP esté en la whitelist de Supabase (por defecto permite todas)
- Verifica las credenciales

### Error de CORS:
- Actualiza CORS_ALLOWED_ORIGINS en settings.py
- Verifica que las URLs coincidan exactamente

### Error de Migraciones:
```bash
# Resetear migraciones si es necesario
python manage.py migrate --fake-initial
```

## 📊 Monitoreo

En el dashboard de Supabase puedes:
- Ver métricas de uso de la base de datos
- Monitoring de queries
- Logs de errores
- Uso de storage

## 🔐 Seguridad

1. **Nunca** hagas commit de las variables de entorno reales
2. Usa GitHub Secrets para las variables sensibles
3. Regenera las API keys periódicamente
4. Usa service_role key solo en el backend
5. Configura Row Level Security (RLS) en Supabase si es necesario

## 📈 Próximos Pasos

1. Migra a Supabase ✅
2. Despliega backend en Railway/Heroku
3. Configura GitHub Pages para el frontend
4. Configurar dominio personalizado (opcional)
5. Configurar CI/CD con GitHub Actions
6. Implementar monitoring y alertas
