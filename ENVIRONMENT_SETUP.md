# Configuración de Variables de Entorno

## 📋 Resumen
Este proyecto utiliza variables de entorno para manejar configuraciones sensibles como API keys. Esta guía explica cómo configurarlas para desarrollo local y producción.

## 🔧 Desarrollo Local

### Opción 1: Editar environment.ts directamente (Recomendado)
1. Ve a `frontend/src/environments/environment.ts`
2. Reemplaza `'YOUR_DEV_API_KEY_HERE'` con tu API key real
3. **NUNCA hagas commit de este cambio**

### Opción 2: Usar archivo .env.local
1. Crear archivo de variables locales:
```bash
cd frontend
cp .env.example .env.local
```
2. Editar .env.local con tus valores reales:
```bash
# Variables de entorno para desarrollo local
LOCATION_API_KEY=tu_api_key_real_aqui
API_URL=http://localhost:8000/api
```

### 3. Obtener API Key de ubicación
1. Ve a: https://countrystatecity.in/
2. Regístrate gratis
3. Copia tu API key
4. Úsala en `environment.ts` o `.env.local`

## 🚀 Producción (GitHub Pages)

### 1. Configurar GitHub Secrets
Ve a tu repositorio en GitHub:
```
Settings > Secrets and variables > Actions > New repository secret
```

Agrega estos secrets:
- **Name**: `LOCATION_API_KEY`
- **Value**: Tu API key real de CountryStateCityAPI

### 2. Variables de producción automáticas
El CI/CD configurará automáticamente:
- `API_URL`: Se configurará según tu dominio de backend en producción
- Base href: `/Rifa/` para GitHub Pages

## ⚠️ Seguridad

### ✅ QUÉ HACER:
- ✅ Usar `.env.local` para desarrollo
- ✅ Configurar secrets en GitHub
- ✅ Usar placeholders en `environment.ts`
- ✅ Incluir `environment.ts` en git (con placeholders)

### ❌ QUÉ NO HACER:
- ❌ Hacer commit de archivos `.env*`
- ❌ Poner API keys reales en `environment.ts`
- ❌ Compartir API keys en código
- ❌ Subir `.env.local` a git

## 📁 Estructura de Archivos

```
frontend/
├── .env.example          # ✅ Template (en git)
├── .env.local           # ❌ Local real (no en git)
└── src/environments/
    ├── environment.ts   # ✅ Dev config (en git, con placeholders)
    └── environment.prod.ts # ✅ Prod config (en git, usa CI/CD secrets)
```

## 🔍 Verificación

### Comprobar configuración local:
```bash
# En frontend/
npm start
# Debe cargar sin errores de API key
```

### Comprobar deployment:
1. Push a GitHub
2. Ve a Actions tab
3. Verifica que el deploy sea exitoso
4. Prueba la app en GitHub Pages

## 🛠️ Troubleshooting

### Error "API key not found":
- Verifica que `.env.local` existe
- Verifica que contiene `LOCATION_API_KEY=`
- Reinicia el servidor de desarrollo

### Error en producción:
- Verifica GitHub Secrets configurado
- Verifica que el workflow tiene acceso a secrets
- Revisa los logs del GitHub Action

## 📞 Soporte
Si tienes problemas, revisa:
1. Console del navegador para errores
2. GitHub Actions logs para errores de build
3. Network tab para verificar llamadas API
