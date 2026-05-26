# surveycore-web

React SPA for SurveyCore — multi-language survey management with role-based access control and Microsoft Entra ID SSO.

**Deployed on:** Azure Static Web Apps (qa: [happy-smoke-01be95e1e.7.azurestaticapps.net](https://happy-smoke-01be95e1e.7.azurestaticapps.net))

## Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| React | 19.2 | UI framework |
| TypeScript | 6.0 | Type safety |
| Vite | 8.0 | Build tool |
| Material-UI (MUI) | 9.0 | Component library |
| TanStack Query | 5.99 | Server state management |
| Zustand | 5.0 | Auth state (Zustand) |
| Axios | 1.15 | HTTP client |
| React Router | 7.14 | Client-side routing |
| React Hook Form | 7.73 | Form handling |
| Zod | 4.3 | Schema validation |
| MSAL | 5.8 / 5.3 | Microsoft authentication (PKCE) |
| **Deployment** | Azure Static Web Apps | GitHub Actions CI/CD |

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

### Architecture

```
GitHub (main/qa/dev)
    ↓
GitHub Actions (`.github/workflows/deploy-azure.yml`)
    ↓
npm ci → npm lint → npm build (produces dist/)
    ↓
Azure Static Web Apps
```

### Branch Strategy

| Branch | Environment | URL | Auto-Deploy |
|--------|-----------|-----|-------------|
| `dev` | Local | `http://localhost:5173` | No |
| `qa` | QA | `https://happy-smoke-01be95e1e.7.azurestaticapps.net` | Yes (GitHub Actions) |
| `main` | Production | `https://surveycore-web.azurestaticapps.net` | Yes (GitHub Actions) |

### GitHub Actions Pipeline (`.github/workflows/deploy-azure.yml`)

**Triggers on:**
- Push to `qa` or `main`
- Pull requests (lint only, no deploy)

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. `npm ci` — install reproducible dependencies
4. `npm run lint` — ESLint validation
5. `npm run build` — compile to `dist/`
6. Deploy to Azure Static Web Apps

**GitHub Secrets (configure in Settings → Secrets):**
- `VITE_AZURE_CLIENT_ID` — Entra ID app ID
- `VITE_AZURE_TENANT_ID` — Entra ID tenant ID
- `AZURE_STATIC_WEB_APPS_TOKEN_QA` — deployment token
- `AZURE_STATIC_WEB_APPS_TOKEN_PRODUCTION` — deployment token

### Manual Deployment

```bash
# QA
git checkout qa
git merge dev
git push origin qa
# → GitHub Actions auto-triggers in ~2-3 min

# Production
git checkout main
git merge qa
git push origin main
# → GitHub Actions auto-triggers in ~2-3 min
```

### SPA Routing & Security

`staticwebapp.config.json` configured for:
- **SPA routing:** Any unknown route → `/index.html`
- **Exclusions:** `/assets/*`, `*.json`, `*.svg`, `*.ico` bypass fallback
- **Caching:** Assets (1 year) vs HTML (no-cache)
- **Security headers:** X-Content-Type-Options, X-Frame-Options, X-XSS-Protection

---

## Verify Deployment

1. **GitHub Actions:** GitHub → Actions → `deploy-azure.yml` → latest run
   - ✅ All checks passed → site is live
   - ❌ Build/lint failed → check output logs

2. **Azure Portal:** portal.azure.com → Static Web Apps → `surveycore-web-qa` → Deployments
   - View latest deployment status
   - Download build logs if needed

3. **Test URLs:**
   - QA: `https://happy-smoke-01be95e1e.7.azurestaticapps.net`
   - Try homepage → `/login` → should load

---

## Troubleshooting

| Issue | Solution |
|---|---|
| CORS error from frontend | Check backend `CORS_ORIGINS` includes frontend URL |
| 404 on `/login` | Ensure `staticwebapp.config.json` deployed (SPA fallback) |
| Token expired / redirect loop | Clear localStorage, reload page |
| Microsoft SSO popup blocked | Ensure login triggered by user click |
| Build fails: `VITE_*` undefined | Check `.env` file exists with `VITE_` prefix |
| "Too many files" Azure error | Ensure `.gitignore` excludes `node_modules/` |
| Blank page on deployment | Check browser console, verify `VITE_API_BASE_URL` correct |
| Lint errors block deploy | Fix ESLint issues or check `eslint.config.js` |

---

## Technology Stack Details

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime |
| npm | 10+ | Package manager |
| TypeScript | 6.0 | Type checking |
| ESLint | 9.39 | Linting |
| Vite | 8.0 | Fast build & HMR |

---

## Development Checklist

- [ ] Node.js 20+ installed
- [ ] `.env` configured with API URL & Azure credentials
- [ ] `npm ci` completed
- [ ] `npm run dev` running on port 5173
- [ ] Backend API accessible at configured URL
- [ ] Browser DevTools → Application → localStorage shows token after login
- [ ] No CORS errors in console

See [CLAUDE.md](./CLAUDE.md) for development patterns, component examples, and API integration details.
