# 🚀 CI/CD y GitHub Pages Setup

## 📋 Configuración Completa de CI/CD

Este proyecto usa **GitHub Actions** para automatizar el proceso de build, testing y deployment.

### 🔧 **Configuración Inicial**

#### 1. **Habilitar GitHub Pages**
1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. Source: **GitHub Actions**
4. Save

#### 2. **Configurar Secrets**
1. Ve a Settings → Secrets and variables → Actions
2. Agrega estos secrets:
   - `LOCATION_API_KEY`: Tu API key de CountryStateCityAPI

#### 3. **Verificar Permisos**
1. Settings → Actions → General
2. **Workflow permissions**: Read and write permissions
3. **Allow GitHub Actions to create and approve pull requests**: ✅

### 🔄 **Flujo de CI/CD**

#### **Trigger Events:**
- ✅ Push a `main` → Build + Test + Deploy
- ✅ Pull Request → Build + Test solamente
- ✅ Manual dispatch → Build + Test + Deploy

#### **Jobs del Pipeline:**

1. **Build & Test** (`build-and-test`)
   - ☁️ Ejecuta en: `ubuntu-latest`
   - 📦 Node.js 20
   - 🔍 Lint del código
   - 🧪 Tests unitarios
   - 🏗️ Build de producción
   - 📤 Upload de artefactos

2. **Deploy** (`deploy`)
   - ☁️ Ejecuta en: `ubuntu-latest` 
   - 🔒 Solo en branch `main`
   - 📥 Download de artefactos
   - 🌐 Deploy a GitHub Pages

### 📁 **Estructura de Files**

```
.github/
  workflows/
    deploy.yml          # Configuración CI/CD
frontend/
  src/
    environments/
      environment.ts     # Config desarrollo
      environment.prod.ts # Config producción
  package.json          # Scripts adicionales
```

### 🛠️ **Scripts NPM Disponibles**

```bash
# Desarrollo
npm start                 # Servidor local
npm run watch            # Build con watch mode

# Testing
npm test                 # Tests interactivos
npm run test:ci          # Tests para CI (headless)

# Build
npm run build            # Build desarrollo
npm run build:prod       # Build producción
npm run build:github     # Build para GitHub Pages

# Otros
npm run lint             # Linting
npm run preview          # Preview de producción
```

### 🌐 **URLs del Proyecto**

- **Desarrollo**: http://localhost:4200/
- **GitHub Pages**: https://sebaescu.github.io/Rifa/
- **Repositorio**: https://github.com/Sebaescu/Rifa

### 🔐 **Variables de Entorno**

#### Desarrollo (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  locationApiKey: 'tu-api-key-local'
};
```

#### Producción (`environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-api-produccion.com/api',
  locationApiKey: 'se-sobrescribe-con-secret'
};
```

### 🚨 **Troubleshooting**

#### **Build Falla**
```bash
# Ejecutar localmente para debug
npm run build:github
```

#### **Tests Fallan**
```bash
# Ejecutar tests en modo CI
npm run test:ci
```

#### **GitHub Pages no Carga**
1. Verificar que el build fue exitoso
2. Revisar la configuración de base-href
3. Verificar permisos de GitHub Pages

### 📊 **Status Badges**

Agrega estos badges a tu README principal:

```markdown
![Deploy Status](https://github.com/Sebaescu/Rifa/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)
![Build Status](https://github.com/Sebaescu/Rifa/workflows/Deploy%20to%20GitHub%20Pages/badge.svg?event=push)
```

### 🔄 **Workflow de Desarrollo**

1. **Feature Development**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push origin feature/nueva-funcionalidad
   ```

2. **Pull Request**
   - Se ejecuta automáticamente: Build + Test
   - Review del código
   - Merge a main

3. **Deployment Automático**
   - Push a main → CI/CD automático
   - Deploy a GitHub Pages
   - ✅ Live en pocos minutos

### 🎯 **Próximos Pasos**

- [ ] Configurar tests e2e con Cypress
- [ ] Agregar notificaciones de Slack/Discord
- [ ] Implementar semantic versioning
- [ ] Configurar staging environment
- [ ] Agregar lighthouse CI para performance
