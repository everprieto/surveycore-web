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
surveycore-web/src/
├── main.tsx                 # Entrypoint React — QueryClient, Router, MsalProvider
├── App.tsx                  # Rutas principales con React Router
├── App.css / index.css
│
├── api/                     # Clientes HTTP (Axios)
│   ├── client.ts            # Instancia Axios + interceptores JWT/401
│   ├── auth.ts              # login(), register(), getMe()
│   ├── projects.ts          # getProjects(), getProject(), createProject()
│   ├── surveys.ts           # getSurvey(), createSurvey(), addQuestion(), generateLinks()...
│   ├── questions.ts         # getQuestions(), createQuestion(), publishQuestion()...
│   ├── results.ts           # getSurveyResults(), getControlTower()
│   └── public.ts            # getSurveyByToken(), submitSurvey()
│
├── auth/
│   └── msalConfig.ts        # Configuración MSAL (PKCE, scopes, redirect)
│
├── components/              # Componentes reutilizables
│   ├── NavBar.tsx           # Navegación + menú usuario + logout
│   ├── ProtectedRoute.tsx   # Guard: redirige a /login si no autenticado
│   ├── PageWrapper.tsx      # Layout wrapper con padding/max-width
│   └── StatusBadge.tsx      # Badge de estado (DRAFT/PUBLISHED/PENDING/etc.)
│
├── pages/                   # Páginas (una por ruta)
│   ├── HomePage.tsx         # Landing / bienvenida
│   ├── LoginPage.tsx        # Formulario login + registro + botón Microsoft SSO
│   ├── ProjectsPage.tsx     # Lista de proyectos del usuario
│   ├── SurveyListPage.tsx   # Encuestas de un proyecto
│   ├── CreateSurveyPage.tsx # Formulario nueva encuesta
│   ├── ConfigureSurveyPage.tsx  # Añadir preguntas, destinatarios, generar links
│   ├── QuestionsPage.tsx    # Biblioteca de preguntas
│   ├── CreateQuestionPage.tsx   # Crear nueva pregunta
│   ├── QuestionDetailPage.tsx   # Detalle + traducciones de una pregunta
│   ├── TakeSurveyPage.tsx   # Encuesta pública (por token, sin auth)
│   ├── SurveyThanksPage.tsx # Página de agradecimiento post-envío
│   ├── SurveyResultsPage.tsx    # Resultados de una encuesta
│   └── ControlTowerPage.tsx # Dashboard global (todas las encuestas)
│
├── store/
│   └── authStore.ts         # Zustand: user, token, login(), logout(), setUser()
│
└── types/
    └── index.ts             # Todas las interfaces TypeScript del dominio
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

### 1. Crear la aplicación en Azure
```bash
# Desde Azure Portal:
1. Crear "Static Web App" resource
2. Conectar repositorio GitHub (autenticarse)
3. Seleccionar rama (main/master)
4. Framework: React
5. App location: / (raíz)
6. Output location: dist
```

### 2. Configuración automática
El workflow de GitHub Actions en `.github/workflows/deploy.yml` se creará automáticamente. **Pero verificar que tenga:**

```yaml
# Clave
app_location: '/'        # Raíz del repo
output_location: 'dist'  # Carpeta de build
skip_app_build: true     # Usa tu workflow personalizado
```

### 3. Secretos y variables
Configurar en Azure Portal → Static Web App → Configuration → Application settings:

| Variable | Valor |
|----------|-------|
| `VITE_API_BASE_URL` | URL backend (ej: `https://surveycore-api.azurewebsites.net`) |
| `VITE_AZURE_CLIENT_ID` | Client ID de Entra ID |
| `VITE_AZURE_TENANT_ID` | Tenant ID de Entra ID |

### 4. Rutas y fallback
El `staticwebapp.config.json` ya está configurado para:
- SPA routing: cualquier ruta desconocida → `index.html`
- Assets estáticos: `/assets/*` excluidos del fallback
- Sin cache: todos los archivos sin cache para SSR-like behavior

### 5. Troubleshooting: "Too many static files"
**Problema:** Azure rechaza el deployment porque detecta +60k archivos.

**Solución:**
- ✅ Usar workflow GitHub Actions (`.github/workflows/deploy.yml`) — ya incluido
- ✅ Asegurarse de que `.gitignore` excluye `node_modules/`
- ✅ No commitear `dist/` — se genera en el workflow
- ✅ Usar `npm ci` en lugar de `npm install` para reproducibilidad

**Si el error persiste:**
```bash
# Verificar que node_modules está en .gitignore
grep "node_modules" .gitignore

# Eliminar node_modules si fue commiteado
git rm -r --cached node_modules
git commit -m "Remove node_modules from tracking"

# Hacer push
git push origin main
```

### 6. Verificar deployment
1. Ir a Azure Portal → Static Web App → Deployments
2. Hacer clic en la ejecución más reciente
3. Si tiene estado ✅ **Build Succeeded**, el sitio está live
4. Si tiene error ❌, hacer clic en el workflow run en GitHub para ver logs

---

## Workflow GitHub Actions

Localización: `.github/workflows/deploy.yml`

**Qué hace:**
1. Checkout del código
2. Setup Node.js 20
3. `npm ci` — instala dependencias reproducibles
4. `npm run lint` — valida TypeScript
5. `npm run build` — compila a `dist/`
6. Publica a Azure Static Web Apps

**Solo se ejecuta:**
- Pushes a `main` o `master`
- PRs (para validación, no deployment)

---
| Ruta no cargada | Verificar `Route` en `App.tsx` y que el componente esté importado |
| Microsoft SSO popup bloqueado | El popup debe abrirse desde un evento de usuario (click) |
