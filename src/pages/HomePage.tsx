import { Box, Typography, Grid, Card, CardActionArea, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { NavBar } from '../components/NavBar';

const MODULES = [
  {
    title: 'Question Library',
    description: 'Create and manage reusable survey questions with multi-language support.',
    icon: '📋',
    to: '/questions',
  },
  {
    title: 'My Projects',
    description: 'Manage client projects and configure surveys for each engagement.',
    icon: '📁',
    to: '/projects',
  },
  {
    title: 'Control Tower',
    description: 'Global dashboard with completion rates and response tracking across all surveys.',
    icon: '🗼',
    to: '/control-tower',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Left panel */}
        <Box
          sx={{
            width: { xs: '100%', md: '35%' },
            bgcolor: '#1a2332',
            color: 'white',
            p: 6,
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography variant="overline" sx={{ color: '#c8102e', letterSpacing: 3, mb: 2 }}>
            GFT TECHNOLOGIES
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Survey Core
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
            Multi-language survey management platform. Design, distribute, and analyze
            client satisfaction surveys with ease.
          </Typography>
          {user && (
            <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Logged in as
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {user.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {user.role}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right panel */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 3, md: 6 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ mb: 4, color: '#1a2332', fontWeight: 600 }}>
            What would you like to do?
          </Typography>
          <Grid container spacing={3}>
            {MODULES.map((mod) => (
              <Grid key={mod.to} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                  }}
                >
                  <CardActionArea onClick={() => navigate(mod.to)} sx={{ height: '100%', p: 1 }}>
                    <CardContent>
                      <Typography variant="h2" sx={{ mb: 2 }}>
                        {mod.icon}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a2332' }}>
                        {mod.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {mod.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
