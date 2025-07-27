# Configuración de Variables de Entorno

## Setup para LocationAPI Service

El servicio de ubicaciones requiere una API key de CountryStateCityAPI.

### Pasos para configurar:

1. **Obtener API Key:**
   - Visita: https://countrystatecity.in/
   - Regístrate y obtén tu API key gratuita

2. **Configurar environment.ts:**
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:8000/api',
     locationApiKey: 'TU_API_KEY_AQUI'
   };
   ```

3. **Para producción (environment.prod.ts):**
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://tu-api-de-produccion.com/api',
     locationApiKey: 'TU_API_KEY_DE_PRODUCCION'
   };
   ```

### Buenas Prácticas:

- ✅ **Nunca** hagas commit de API keys
- ✅ Usa archivos de environment para diferentes entornos
- ✅ Documenta las variables necesarias en `.env.example`
- ✅ Agrega `.env*` al `.gitignore`

### Variables de Entorno Disponibles:

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `locationApiKey` | API Key de CountryStateCityAPI | ✅ |
| `apiUrl` | URL del backend API | ✅ |
| `production` | Modo de producción | ✅ |

### Límites de la API:

- Plan gratuito: 1000 requests/mes
- Sin autenticación: 100 requests/día
- Con API key: Límites más altos

### Uso en el código:

```typescript
import { environment } from '../../../environments/environment';

// ✅ Correcto
private readonly apiKey = environment.locationApiKey;

// ❌ Incorrecto - hardcoded
private readonly apiKey = 'tu-api-key-aqui';
```
