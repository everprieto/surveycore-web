import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import { useMsal } from '@azure/msal-react';

// Static imports for critical pages
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { authApi } from './api/auth';
import { ImpersonationBanner } from './components/ImpersonationBanner';

// Lazy load other pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const QuestionsPage = lazy(() => import('./pages/QuestionsPage').then(m => ({ default: m.QuestionsPage })));
const CreateQuestionPage = lazy(() => import('./pages/CreateQuestionPage').then(m => ({ default: m.CreateQuestionPage })));
const QuestionDetailPage = lazy(() => import('./pages/QuestionDetailPage').then(m => ({ default: m.QuestionDetailPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const SurveyListPage = lazy(() => import('./pages/SurveyListPage').then(m => ({ default: m.SurveyListPage })));
const CreateSurveyPage = lazy(() => import('./pages/CreateSurveyPage').then(m => ({ default: m.CreateSurveyPage })));
const ConfigureSurveyPage = lazy(() => import('./pages/ConfigureSurveyPage').then(m => ({ default: m.ConfigureSurveyPage })));
const SurveyResultsPage = lazy(() => import('./pages/SurveyResultsPage').then(m => ({ default: m.SurveyResultsPage })));
const ControlTowerPage = lazy(() => import('./pages/ControlTowerPage').then(m => ({ default: m.ControlTowerPage })));
const TakeSurveyPage = lazy(() => import('./pages/TakeSurveyPage').then(m => ({ default: m.TakeSurveyPage })));
const SurveyThanksPage = lazy(() => import('./pages/SurveyThanksPage').then(m => ({ default: m.SurveyThanksPage })));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage').then(m => ({ default: m.UnauthorizedPage })));
const UsersPage = lazy(() => import('./pages/admin/UsersPage').then(m => ({ default: m.UsersPage })));
const RolesPage = lazy(() => import('./pages/admin/RolesPage').then(m => ({ default: m.RolesPage })));

// Loading fallback component
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

const theme = createTheme({
  palette: {
    primary: { main: '#c8102e' },
    secondary: { main: '#1a2332' },
  },
});

function AuthExpiredListener() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  useEffect(() => {
    const expiredHandler = () => {
      clearAuth();
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };
    const forbiddenHandler = () => {
      if (window.location.pathname !== '/unauthorized') {
        navigate('/unauthorized', { replace: true });
      }
    };
    window.addEventListener('auth:expired', expiredHandler);
    window.addEventListener('auth:forbidden', forbiddenHandler);
    return () => {
      window.removeEventListener('auth:expired', expiredHandler);
      window.removeEventListener('auth:forbidden', forbiddenHandler);
    };
  }, []);
  return null;
}

function AppRoutes() {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Handle MSAL redirect callback first
    instance.handleRedirectPromise()
      .then(async (result) => {
        if (result?.idToken) {
          // Completing a Microsoft login redirect
          try {
            const tokenData = await authApi.microsoftLogin(result.idToken);
            setToken(tokenData.access_token);
            const userData = await authApi.getMe();
            setUser(userData);
            navigate('/home', { replace: true });
          } catch (err) {
            console.error('Backend auth error:', err);
            clearAuth();
            navigate('/login', { replace: true });
          }
        } else if (token && !user) {
          // Page reload with existing token — re-hydrate user
          try {
            const userData = await authApi.getMe();
            setUser(userData);
          } catch {
            // auth:expired event will handle the redirect
          }
        }
      })
      .catch((err) => console.error('MSAL redirect error:', err))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <ImpersonationBanner />
      <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/survey/:token" element={<Suspense fallback={<PageLoader />}><TakeSurveyPage /></Suspense>} />
      <Route path="/survey/:token/thanks" element={<Suspense fallback={<PageLoader />}><SurveyThanksPage /></Suspense>} />
      <Route path="/unauthorized" element={<Suspense fallback={<PageLoader />}><UnauthorizedPage /></Suspense>} />

      {/* Protected routes — project.view */}
      <Route path="/home" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><HomePage /></Suspense></ProtectedRoute>} />
      <Route path="/questions" element={<ProtectedRoute requiredPermission="project.view"><Suspense fallback={<PageLoader />}><QuestionsPage /></Suspense></ProtectedRoute>} />
      <Route path="/questions/create" element={<ProtectedRoute requiredPermission="survey.edit"><Suspense fallback={<PageLoader />}><CreateQuestionPage /></Suspense></ProtectedRoute>} />
      <Route path="/questions/:questionId" element={<ProtectedRoute requiredPermission="project.view"><Suspense fallback={<PageLoader />}><QuestionDetailPage /></Suspense></ProtectedRoute>} />
      <Route path="/questions/:questionId/edit" element={<ProtectedRoute requiredPermission="survey.edit"><Suspense fallback={<PageLoader />}><CreateQuestionPage /></Suspense></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute requiredPermission="project.view"><Suspense fallback={<PageLoader />}><ProjectsPage /></Suspense></ProtectedRoute>} />
      <Route path="/projects/:projectId/surveys" element={<ProtectedRoute requiredPermission="project.view"><Suspense fallback={<PageLoader />}><SurveyListPage /></Suspense></ProtectedRoute>} />
      <Route path="/projects/:projectId/surveys/create" element={<ProtectedRoute requiredPermission="survey.create"><Suspense fallback={<PageLoader />}><CreateSurveyPage /></Suspense></ProtectedRoute>} />
      <Route path="/surveys/:surveyId/configure" element={<ProtectedRoute requiredPermission="project.view"><Suspense fallback={<PageLoader />}><ConfigureSurveyPage /></Suspense></ProtectedRoute>} />
      <Route path="/surveys/:surveyId/results" element={<ProtectedRoute requiredPermission="results.view"><Suspense fallback={<PageLoader />}><SurveyResultsPage /></Suspense></ProtectedRoute>} />
      <Route path="/control-tower" element={<ProtectedRoute requiredPermission="results.view"><Suspense fallback={<PageLoader />}><ControlTowerPage /></Suspense></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin/users" element={<ProtectedRoute requiredPermission="users.manage"><Suspense fallback={<PageLoader />}><UsersPage /></Suspense></ProtectedRoute>} />
      <Route path="/admin/roles" element={<ProtectedRoute requiredPermission="roles.manage"><Suspense fallback={<PageLoader />}><RolesPage /></Suspense></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/home" replace />} />
    </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthExpiredListener />
          <AppRoutes />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
