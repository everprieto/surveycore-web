# surveycore-web

React SPA for SurveyCore — multi-language survey management with role-based access control and Microsoft Entra ID SSO.

**Deployed on:** [Azure Static Web Apps](https://happy-smoke-01be95e1e.7.azurestaticapps.net)

## Stack

| | |
|---|---|
| **Framework** | React 19 · TypeScript 6 · Vite 8 |
| **UI** | Material-UI 9 |
| **State** | Zustand 5 (auth) · TanStack Query 5 (server state) |
| **Auth** | JWT · MSAL PKCE (Microsoft Entra ID) |
| **Forms** | React Hook Form · Zod |
| **Deployment** | Azure Static Web Apps (qa/main branches) |

---

## Quick Start (Local Development)

```bash
# 1. Clone and enter repo
git clone https://github.com/everprieto/surveycore-web.git
cd surveycore-web
git checkout dev

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:8000

# 4. Run
npm run dev       # http://localhost:5173
npm run build     # Production build → dist/
npm run lint      # ESLint check
```

**Requires:** Backend API running at configured `VITE_API_BASE_URL`

---

## Project Structure

```
surveycore-web/
├── src/
│   ├── api/                  # Axios clients (auth, surveys, projects, results…)
│   ├── auth/                 # MSAL config (Microsoft Entra ID SSO)
│   ├── components/           # Reusable: NavBar, ProtectedRoute, PageWrapper…
│   ├── constants/            # Permission codes, role definitions
│   ├── hooks/                # usePermission, useDebounce, custom hooks
│   ├── pages/                # One component per route
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── SurveyListPage.tsx
│   │   ├── ConfigureSurveyPage.tsx
│   │   ├── QuestionsPage.tsx
│   │   ├── QuestionDetailPage.tsx
│   │   ├── TakeSurveyPage.tsx
│   │   ├── SurveyResultsPage.tsx
│   │   ├── ControlTowerPage.tsx
│   │   └── admin/
│   │       ├── UsersPage.tsx
│   │       └── RolesPage.tsx
│   ├── store/                # authStore (Zustand)
│   ├── types/                # TypeScript interfaces
│   ├── App.tsx               # Router configuration
│   └── main.tsx              # React entry point
├── public/                   # Static assets
│   ├── favicon.svg
│   └── icons.svg
├── .github/workflows/        # CI/CD
│   └── deploy-azure.yml      # GitHub Actions → Azure Static Web Apps
├── .env.example              # Local dev template
├── .env.qa.example           # QA environment variables
├── .env.production.example   # Production variables
├── staticwebapp.config.json  # Azure SPA routing config
├── CLAUDE.md                 # Frontend development guide
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .gitignore
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Examples |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` (dev) · `https://surveycore-api.onrender.com` (qa/prod) |
| `VITE_AZURE_CLIENT_ID` | Entra ID app registration | `4012c112-0db8-4411-85e5-907edceb644e` |
| `VITE_AZURE_TENANT_ID` | Entra ID tenant ID | `0a964db6-c0c3-43a8-af0d-bccc2d2bd487` |

**Per-environment examples:**
- `.env.example` → Local dev (localhost backend)
- `.env.qa.example` → QA (Render backend)
- `.env.production.example` → Production (Render backend)

---

## Routes & Pages

| Route | Component | Auth |
|---|---|---|
| `/` | HomePage | Public |
| `/login` | LoginPage | Public |
| `/projects` | ProjectsPage | JWT required |
| `/projects/:id/surveys` | SurveyListPage | JWT required |
| `/surveys/:id/configure` | ConfigureSurveyPage | JWT required |
| `/questions` | QuestionsPage | JWT required |
| `/questions/:id` | QuestionDetailPage | JWT required |
| `/results/:id` | SurveyResultsPage | JWT required |
| `/control-tower` | ControlTowerPage | JWT required |
| `/admin/users` | UsersPage | Admin role |
| `/admin/roles` | RolesPage | Admin role |
| `/survey/:token` | TakeSurveyPage | Token-based (public) |

---

## Deployment

### Branch Strategy

| Branch | Environment | URL |
|---|---|---|
| `dev` | Local | `http://localhost:5173` |
| `qa` | QA | `https://happy-smoke-01be95e1e.7.azurestaticapps.net` |
| `main` | Production | (separate Azure Static Web App) |

### Push to Deploy

All deployments use GitHub Actions + Azure Static Web Apps:

```bash
# QA deployment
git checkout qa
git merge dev
git push origin qa
# Workflow triggers: build, lint, deploy to Azure

# Production deployment
git checkout main
git merge qa
git push origin main
# Workflow triggers: build, lint, deploy to Azure
```

**GitHub Secrets Required:**
- `VITE_AZURE_CLIENT_ID` — Entra ID client
- `VITE_AZURE_TENANT_ID` — Entra ID tenant
- `AZURE_STATIC_WEB_APPS_TOKEN_QA` — Azure deployment token (qa branch)
- `AZURE_STATIC_WEB_APPS_TOKEN_PRODUCTION` — Azure deployment token (main branch)

### SPA Routing

`staticwebapp.config.json` configures Azure to:
- Serve `/index.html` for all unknown routes (SPA fallback)
- Exclude `/assets/*`, images, and manifests from fallback
- Enable caching for assets, disable for HTML

---

## Troubleshooting

| Issue | Solution |
|---|---|
| CORS error from frontend | Check `CORS_ORIGINS` in backend, include frontend URL |
| 404 on `/login` | Ensure `staticwebapp.config.json` is deployed to Azure |
| Token expired / redirect loop | Clear localStorage, reload page |
| Microsoft SSO popup blocked | Ensure login triggered by user click (not auto) |
| Build fails: `VITE_*` undefined | Check `.env` file exists with correct prefix |

See [CLAUDE.md](./CLAUDE.md) for development patterns and API integration details.
