import { useState } from 'react';
import { Container, Box, Button, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../auth/msalConfig';

export function LoginPage() {
  const { instance } = useMsal();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMicrosoftLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await instance.loginRedirect(loginRequest);
    } catch (err: unknown) {
      setLoading(false);
      const message = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setError(message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: { xs: 6, md: 12 } }}>
        <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            SurveyCore
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
            Sign in with your corporate Microsoft account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleMicrosoftLogin}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <MicrosoftIcon />}
            sx={{
              py: 1.5,
              backgroundColor: '#0078d4',
              '&:hover': { backgroundColor: '#106ebe' },
            }}
          >
            {loading ? 'Redirecting to Microsoft…' : 'Sign in with Microsoft'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}
