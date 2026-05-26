# SurveyCore Web Agent — SurveyCore

Agente especializado en el Web de SurveyCore.  
Stack: **React 19 · TypeScript 6 · Material-UI 9 · Vite 8 · TanStack Query 5 · Zustand 5**

---

## Levantar el Frontend

```bash
# Desde la raíz del repo (surveycore-web/)
npm install
npm run dev        # http://localhost:5173
npm run build      # Compilar a dist/
npm run lint       # ESLint check
```

Backend esperado en `http://localhost:8000` (ver `.env`).

---

## Estructura de Archivos

```
surveycore-web/
├── src/
│   ├── main.tsx                 # React entry point — QueryClient, Router, MsalProvider
│   ├── App.tsx                  # React Router configuration — todas las rutas
│   ├── App.css / index.css      # Global styles
│   │
│   ├── api/                     # Axios HTTP clients
│   │   ├── client.ts            # Axios instance + JWT interceptor + 401 handler
│   │   ├── auth.ts              # login(), register(), getMe()
│   │   ├── projects.ts          # CRUD de proyectos
│   │   ├── surveys.ts           # CRUD de encuestas + generateLinks
│   │   ├── questions.ts         # CRUD de preguntas + publish
│   │   ├── results.ts           # getSurveyResults(), getControlTower()
│   │   └── public.ts            # getSurveyByToken(), submitSurvey() — sin auth
│   │
│   ├── auth/
│   │   └── msalConfig.ts        # MSAL config (PKCE, tenants, redirect)
│   │
│   ├── components/              # Reusable components
│   │   ├── NavBar.tsx           # Top nav + user menu + logout
│   │   ├── ProtectedRoute.tsx   # Auth guard — redirect /login si no token
│   │   ├── PageWrapper.tsx      # Layout wrapper con padding/max-width
│   │   └── StatusBadge.tsx      # MUI Chip — DRAFT/PUBLISHED/PENDING colors
│   │
│   ├── constants/               # Constantes globales (si existen)
│   │   └── permissions.ts       # Códigos de permisos, roles
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── usePermission.ts     # Check user role/permission
│   │   └── useDebounce.ts       # Debounce para searches
│   │
│   ├── pages/                   # Una componente por ruta
│   │   ├── HomePage.tsx         # Landing / bienvenida
│   │   ├── LoginPage.tsx        # Email/password + SSO Microsoft
│   │   ├── ProjectsPage.tsx     # Lista de proyectos
│   │   ├── SurveyListPage.tsx   # Encuestas de un proyecto
│   │   ├── CreateSurveyPage.tsx # Formulario nueva encuesta
│   │   ├── ConfigureSurveyPage.tsx  # Añadir preguntas + destinatarios + generar links
│   │   ├── QuestionsPage.tsx    # Biblioteca de preguntas
│   │   ├── CreateQuestionPage.tsx   # Crear pregunta (con traducciones)
│   │   ├── QuestionDetailPage.tsx   # Ver + editar pregunta
│   │   ├── TakeSurveyPage.tsx   # Encuesta pública (por token)
│   │   ├── SurveyThanksPage.tsx # Agradecimiento post-submit
│   │   ├── SurveyResultsPage.tsx    # Analytics de encuesta
│   │   ├── ControlTowerPage.tsx # Dashboard global
│   │   └── admin/               # Admin pages
│   │       ├── UsersPage.tsx    # Gestión de usuarios
│   │       └── RolesPage.tsx    # Gestión de roles
│   │
│   ├── store/
│   │   └── authStore.ts         # Zustand: user, token, auth methods
│   │
│   └── types/
│       └── index.ts             # TypeScript interfaces del dominio
│
├── public/                      # Static assets (images, icons)
│   ├── favicon.svg
│   └── icons.svg
│
├── .github/workflows/           # CI/CD pipelines
│   └── deploy-azure.yml         # GitHub Actions → Azure Static Web Apps
│
├── staticwebapp.config.json     # Azure SPA routing + security headers
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts               # Vite build config
├── eslint.config.js             # ESLint rules
├── package.json / package-lock.json
├── .env.example / .env.qa.example / .env.production.example
├── CLAUDE.md                    # Este archivo
├── README.md
└── .gitignore
```

---

## Variables de Entorno (`.env` en raíz del repo)

```
VITE_API_BASE_URL=http://localhost:8000
VITE_AZURE_CLIENT_ID=571c0742-cd9d-4b30-9c88-692a4e7c37fa
VITE_AZURE_TENANT_ID=0a964db6-c0c3-43a8-af0d-bccc2d2bd487
```

Acceder en código: `import.meta.env.VITE_API_BASE_URL`

---

## Cliente HTTP (`api/client.ts`)

```typescript
// Interceptor de request — añade JWT automáticamente
config.headers.Authorization = `Bearer ${token}`;

// Interceptor de response — maneja expiración
if (error.response?.status === 401) {
  window.dispatchEvent(new Event('auth:expired'));
  // → logout automático en authStore listener
}
```

**Patrón de uso en páginas:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, createProject } from '../api/projects';

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['projects'],
  queryFn: getProjects,
});

// Mutation
const qc = useQueryClient();
const mutation = useMutation({
  mutationFn: createProject,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
});
```

---

## Autenticación

### Estado global (`store/authStore.ts` — Zustand)
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}
```

Token guardado en `localStorage` bajo la clave `token`.

### Rutas protegidas (`components/ProtectedRoute.tsx`)
```tsx
// Envolver páginas que requieren auth
<Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
```

### Login Microsoft SSO
1. Usuario hace clic en "Login with Microsoft" → MSAL abre popup PKCE
2. MSAL devuelve `id_token` (Azure AD)
3. Frontend llama `POST /auth/microsoft` con `{ id_token }`
4. Backend valida y devuelve JWT interno
5. Frontend guarda token en store/localStorage

Configuración MSAL en `auth/msalConfig.ts`:
```typescript
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
  }
};
```

---

## Tipos TypeScript (`types/index.ts`)

```typescript
// Principales interfaces del dominio
User           — id, name, email, role
Question       — id, logical_code, answer_type, status, translations[], options[]
Project        — id, project_code, project_name, manager_id, created_at
Survey         — id, project_id, survey_type, language_code, survey_status
SurveyConfig   — survey + questions[] + recipients[] + access_links[]
AccessLink     — id, token, recipient_name, status (PENDING/OPENED/COMPLETED)
Recipient      — id, name, email, company, role
SurveyResults  — survey + questions[] con answers[] por respondente
ControlTowerRow— project_name, survey_id, total_recipients, completed, last_activity
```

---

## Patrones de Implementación

### Nueva página
```tsx
// pages/MyNewPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Container, Typography, CircularProgress } from '@mui/material';
import PageWrapper from '../components/PageWrapper';

export default function MyNewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-resource'],
    queryFn: fetchMyResource,
  });

  if (isLoading) return <CircularProgress />;
  if (error) return <Typography color="error">Error al cargar</Typography>;

  return (
    <PageWrapper>
      <Container maxWidth="lg">
        <Typography variant="h4">Mi Página</Typography>
        {/* contenido */}
      </Container>
    </PageWrapper>
  );
}
```

### Nueva función API
```typescript
// api/myresource.ts
import apiClient from './client';
import { MyType } from '../types';

export const getMyResource = async (id: number): Promise<MyType> => {
  const { data } = await apiClient.get<MyType>(`/myresource/${id}`);
  return data;
};

export const createMyResource = async (payload: MyCreatePayload): Promise<MyType> => {
  const { data } = await apiClient.post<MyType>('/myresource/', payload);
  return data;
};
```

### Añadir ruta en App.tsx
```tsx
import MyNewPage from './pages/MyNewPage';

// Ruta pública
<Route path="/public-page" element={<MyNewPage />} />

// Ruta protegida
<Route path="/protected-page" element={<ProtectedRoute><MyNewPage /></ProtectedRoute>} />
```

---

## Tipos de Respuesta para Encuestas

Los tipos de respuesta determinan el componente de UI:

| Tipo | Componente |
|------|------------|
| `RATING` | Radio buttons 1–5 |
| `DROPDOWN` | `<Select>` MUI (opción única) |
| `MULTI_SELECT` | Checkboxes MUI (múltiple) |
| `TEXT` | `<TextField>` multilinea |

La página pública `TakeSurveyPage.tsx` renderiza dinámicamente según `question.answer_type`.

---

## Componentes Reutilizables

### StatusBadge
```tsx
<StatusBadge status="PUBLISHED" />   // → chip verde
<StatusBadge status="DRAFT" />       // → chip gris
<StatusBadge status="COMPLETED" />   // → chip azul
```

### PageWrapper
```tsx
<PageWrapper title="Mi Página">
  {/* contenido con padding y max-width consistente */}
</PageWrapper>
```

### ProtectedRoute
```tsx
<ProtectedRoute>
  <ComponenteProtegido />
</ProtectedRoute>
```

---

## Gestión de Estado (Zustand + React Query)

- **Zustand** (`authStore`): solo estado de autenticación (user, token)
- **React Query**: todo el estado del servidor (listas, detalles, mutations)
- **No Redux / Context API** para datos del servidor

Invalidar cache después de mutaciones:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['surveys'] });
  queryClient.invalidateQueries({ queryKey: ['survey', id] });
}
```

---

## Problemas Frecuentes

| Problema | Solución |
|----------|----------|
| CORS error al llamar backend | Verificar `VITE_API_BASE_URL` en `.env` y `CORS_ORIGINS` en backend |
| Token expirado — loop redirect | Limpiar `localStorage` y recargar |
| `useQuery` no se actualiza | Llamar `queryClient.invalidateQueries()` después de mutations |
| MUI tema inconsistente | Envolver en `ThemeProvider` en `main.tsx` |
| `import.meta.env` undefined | Prefijo `VITE_` obligatorio en variables de entorno |

---

## Deployment a Azure Static Web Apps

### Configuración Actual

**Azure Static Web App** conectada a repositorio GitHub con CI/CD automático:

| Rama | Entorno | URL |
|------|---------|-----|
| `dev` | Local | `http://localhost:5173` |
| `qa` | QA | `https://happy-smoke-01be95e1e.7.azurestaticapps.net` |
| `main` | Production | (separate Azure Static Web App) |

### 1. Workflow GitHub Actions (`.github/workflows/deploy-azure.yml`)

Se ejecuta automáticamente en:
- Push a `qa` o `main`
- Pull requests (sin deployment)

**Pipeline:**
1. Checkout código
2. Setup Node.js 20
3. `npm ci` — instala dependencias reproducibles
4. `npm run lint` — valida TypeScript
5. `npm run build` — compila a `dist/`
6. Deploy a Azure Static Web Apps

### 2. Secretos GitHub requeridos

Configurar en GitHub → Settings → Secrets and variables:

| Secret | Valor |
|--------|-------|
| `VITE_AZURE_CLIENT_ID` | Client ID de Entra ID |
| `VITE_AZURE_TENANT_ID` | Tenant ID de Entra ID |
| `AZURE_STATIC_WEB_APPS_TOKEN_QA` | Token deployment QA |
| `AZURE_STATIC_WEB_APPS_TOKEN_PRODUCTION` | Token deployment Production |

### 3. Variables de entorno por rama

Configurar en Azure Portal → Static Web App → Configuration → Application settings:

| Variable | QA | Production |
|----------|----|----|
| `VITE_API_BASE_URL` | `https://surveycore-api-qa.azurewebsites.net` | `https://surveycore-api.azurewebsites.net` |
| `VITE_AZURE_CLIENT_ID` | ID de Entra ID | ID de Entra ID |
| `VITE_AZURE_TENANT_ID` | Tenant ID | Tenant ID |

### 4. SPA Routing & Security

`staticwebapp.config.json` configurado para:

**Routing:**
- SPA fallback: cualquier ruta desconocida → `index.html` (excepto assets)
- Exclusiones: `/assets/*`, `*.json`, `*.svg`, `*.ico` no redirigen

**Caching:**
- Assets (`/assets/*`): 1 año de cache (immutable)
- HTML/JS/CSS: sin cache (`no-cache, no-store, must-revalidate`)

**Headers de seguridad:**
- `X-Content-Type-Options: nosniff` — previene MIME sniffing
- `X-Frame-Options: DENY` — previene clickjacking
- `X-XSS-Protection: 1; mode=block` — protege contra XSS

### 5. Despliegue Manual

```bash
# QA deployment
git checkout qa
git merge dev
git push origin qa
# → GitHub Actions auto-triggers build & deploy

# Production deployment
git checkout main
git merge qa
git push origin main
# → GitHub Actions auto-triggers build & deploy
```

### 6. Verificar deployment

1. GitHub → Actions → workflow run de rama
2. Si ✅ **Build succeeded**: deployment completó
3. Si ❌ error: ver logs en GitHub Actions → step-by-step output

**Links útiles:**
- QA: `https://happy-smoke-01be95e1e.7.azurestaticapps.net`
- Azure Portal: `portal.azure.com` → Static Web Apps → deployments

---
| Ruta no cargada | Verificar `Route` en `App.tsx` y que el componente esté importado |
| Microsoft SSO popup bloqueado | El popup debe abrirse desde un evento de usuario (click) |
