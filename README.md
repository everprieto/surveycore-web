# surveycore-web

React SPA for SurveyCore — multi-language survey management with role-based access control and Microsoft Entra ID SSO.

## Stack

| | |
|---|---|
| **Framework** | React 19 · TypeScript 6 · Vite 8 |
| **UI** | Material-UI 9 |
| **State** | Zustand 5 (auth) · TanStack Query 5 (server state) |
| **Auth** | JWT · MSAL PKCE (Microsoft Entra ID) |
| **Forms** | React Hook Form · Zod |

---

## Quick Start

```bash
# 1. Clone and enter repo
git clone <url> surveycore-web
cd surveycore-web

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Run
npm run dev       # http://localhost:5173
npm run build     # Production build → dist/
npm run lint      # ESLint check
```

Requires the API running at the URL configured in `VITE_API_BASE_URL`.

---

## Project Structure

```
surveycore-web/
├── src/
│   ├── api/              # Axios clients per domain (auth, surveys, projects…)
│   ├── auth/             # MSAL config (Microsoft SSO)
│   ├── components/       # NavBar, ProtectedRoute, PageWrapper, StatusBadge…
│   ├── constants/        # Permission codes, roles
│   ├── hooks/            # usePermission, useDebounce
│   ├── pages/            # One component per route
│   │   └── admin/        # UsersPage, RolesPage
│   ├── store/            # authStore (Zustand)
│   └── types/            # All TypeScript domain interfaces
├── public/
├── .env.example
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend URL — `http://localhost:8000` for dev |
| `VITE_AZURE_CLIENT_ID` | Entra ID client — optional, only needed for SSO login |
| `VITE_AZURE_TENANT_ID` | Entra ID tenant — optional, only needed for SSO login |

---

## Pages

| Route | Page | Auth |
|---|---|---|
| `/` | HomePage | Public |
| `/login` | LoginPage | Public |
| `/projects` | ProjectsPage | Protected |
| `/projects/:id/surveys` | SurveyListPage | Protected |
| `/surveys/:id/configure` | ConfigureSurveyPage | Protected |
| `/questions` | QuestionsPage | Protected |
| `/questions/:id` | QuestionDetailPage | Protected |
| `/results/:id` | SurveyResultsPage | Protected |
| `/control-tower` | ControlTowerPage | Protected |
| `/admin/users` | UsersPage | Admin only |
| `/admin/roles` | RolesPage | Admin only |
| `/survey/:token` | TakeSurveyPage | No auth (public token) |

---

## Azure Deployment

Deploy as **Azure Static Web Apps**:
- App location: `/`
- Output location: `dist`
- Set environment variables in Azure Static Web Apps → Configuration
