# GitHub Secrets Setup - Frontend (surveycore-web)

Instrucciones para configurar los **secretos de GitHub** necesarios para el CI/CD del frontend con las tres ramas.

---

## 📍 Ubicación: Secrets en GitHub

1. Ve a: **github.com/everprieto/surveycore-web**
2. Settings → Security → Secrets and variables → Actions
3. Haz clic en "New repository secret"

---

## 🔑 Secretos Requeridos

| Secret | Valor | Notas |
|--------|-------|-------|
| `VITE_AZURE_CLIENT_ID` | Client ID de Entra ID | Shared (mismo en todos los ambientes) |
| `VITE_AZURE_TENANT_ID` | Tenant ID de Entra ID | Shared (mismo en todos los ambientes) |
| `VITE_API_BASE_URL_QA` | `https://surveycore-api-qa.azurewebsites.net` | Para rama `qa` |
| `VITE_API_BASE_URL_PRODUCTION` | `https://surveycore-api.azurewebsites.net` | Para rama `main` |
| `AZURE_STATIC_WEB_APPS_TOKEN_QA` | Token deploy Azure SWA (QA) | Para rama `qa` |
| `AZURE_STATIC_WEB_APPS_TOKEN_PRODUCTION` | Token deploy Azure SWA (Prod) | Para rama `main` |

---

## 📋 Cómo obtener cada valor

### 1️⃣ Client ID y Tenant ID (Entra ID)
```
Azure Portal → Entra ID → App registrations → SurveyCore
  ↓
VITE_AZURE_CLIENT_ID = "Application (client) ID"
VITE_AZURE_TENANT_ID = "Directory (tenant) ID"
```

### 2️⃣ Azure Static Web Apps Tokens
```
Azure Portal → Static Web Apps → surveycore-web-qa
  → Overview → "Manage deployment token"
  → Copiar token (válido 1 año)

Azure Portal → Static Web Apps → surveycore-web-main
  → Overview → "Manage deployment token"
  → Copiar token (válido 1 año)
```

---

## ✅ Checklist de Secretos

- [ ] `VITE_AZURE_CLIENT_ID`
- [ ] `VITE_AZURE_TENANT_ID`
- [ ] `VITE_API_BASE_URL_QA`
- [ ] `VITE_API_BASE_URL_PRODUCTION`
- [ ] `AZURE_STATIC_WEB_APPS_TOKEN_QA`
- [ ] `AZURE_STATIC_WEB_APPS_TOKEN_PRODUCTION`

---

## 🚀 Estrategia de Ramas

| Rama | Ambiente | Acciones | Deploy |
|------|----------|----------|--------|
| **dev** | Local | Build + Lint | ❌ No |
| **qa** | QA Azure | Build + Lint + Deploy | ✅ Sí (SWA QA) |
| **main** | Production Azure | Build + Lint + Deploy | ✅ Sí (SWA Prod) |
| **PR** a cualquier rama | CI | Build + Lint | ❌ No |

---

## 🔍 Verificar Deployment

1. **GitHub** → Actions → selecciona el workflow ejecutado
2. Verifica que todos los pasos fueron exitosos
3. **Azure Portal** → Static Web Apps → verifica estado "Running"
4. **Test**: visita la URL del sitio (`https://surveycore-qa.azurewebsites.net` o similar)

---

## 📝 Flujo de Desarrollo

```
dev (localhost)
  ↓
Commit + Push a rama dev
  ↓ (solo build/lint, sin deploy)
  ↓
Merge a rama qa
  ↓ (deploy a Azure QA)
  ↓
Merge a rama main
  ↓ (deploy a Azure Production)
```
