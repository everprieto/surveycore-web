import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import { useMsal } from '@azure/msal-react';

import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { QuestionsPage } from './pages/QuestionsPage';
import { CreateQuestionPage } from './pages/CreateQuestionPage';
import { QuestionDetailPage } from './pages/QuestionDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SurveyListPage } from './pages/SurveyListPage';
import { CreateSurveyPage } from './pages/CreateSurveyPage';
import { ConfigureSurveyPage } from './pages/ConfigureSurveyPage';
import { SurveyResultsPage } from './pages/SurveyResultsPage';
import { ControlTowerPage } from './pages/ControlTowerPage';
import { TakeSurveyPage } from './pages/TakeSurveyPage';
import { SurveyThanksPage } from './pages/SurveyThanksPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ImpersonationBanner } from './components/ImpersonationBanner';
import { UsersPage } from './pages/admin/UsersPage';
import { RolesPage } from './pages/admin/RolesPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { authApi } from './api/auth';

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
      <Route path="/survey/:token" element={<TakeSurveyPage />} />
      <Route path="/survey/:token/thanks" element={<SurveyThanksPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected routes — project.view */}
      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/questions" element={<ProtectedRoute requiredPermission="project.view"><QuestionsPage /></ProtectedRoute>} />
      <Route path="/questions/create" element={<ProtectedRoute requiredPermission="survey.edit"><CreateQuestionPage /></ProtectedRoute>} />
      <Route path="/questions/:questionId" element={<ProtectedRoute requiredPermission="project.view"><QuestionDetailPage /></ProtectedRoute>} />
      <Route path="/questions/:questionId/edit" element={<ProtectedRoute requiredPermission="survey.edit"><CreateQuestionPage /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute requiredPermission="project.view"><ProjectsPage /></ProtectedRoute>} />
      <Route path="/projects/:projectId/surveys" element={<ProtectedRoute requiredPermission="project.view"><SurveyListPage /></ProtectedRoute>} />
      <Route path="/projects/:projectId/surveys/create" element={<ProtectedRoute requiredPermission="survey.create"><CreateSurveyPage /></ProtectedRoute>} />
      <Route path="/surveys/:surveyId/configure" element={<ProtectedRoute requiredPermission="project.view"><ConfigureSurveyPage /></ProtectedRoute>} />
      <Route path="/surveys/:surveyId/results" element={<ProtectedRoute requiredPermission="results.view"><SurveyResultsPage /></ProtectedRoute>} />
      <Route path="/control-tower" element={<ProtectedRoute requiredPermission="results.view"><ControlTowerPage /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin/users" element={<ProtectedRoute requiredPermission="users.manage"><UsersPage /></ProtectedRoute>} />
      <Route path="/admin/roles" element={<ProtectedRoute requiredPermission="roles.manage"><RolesPage /></ProtectedRoute>} />

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
