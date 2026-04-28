import { Box, Typography, Button, Chip } from '@mui/material';
import { Visibility as VisibilityIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function ImpersonationBanner() {
  const isImpersonating  = useAuthStore((s) => s.isImpersonating);
  const user             = useAuthStore((s) => s.user);
  const originalUser     = useAuthStore((s) => s.originalUser);
  const stopImpersonation = useAuthStore((s) => s.stopImpersonation);
  const navigate         = useNavigate();

  if (!isImpersonating) return null;

  const handleStop = () => {
    stopImpersonation();
    navigate('/admin/users', { replace: true });
  };

  return (
    <Box
      sx={{
        bgcolor: '#f59e0b',
        color: '#1a2332',
        py: 0.75,
        px: { xs: 1.5, md: 3 },
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, md: 2 },
        flexWrap: 'wrap',
        zIndex: 1200,
        position: 'sticky',
        top: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,.2)',
      }}
    >
      <VisibilityIcon sx={{ fontSize: 18 }} />

      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.78rem', md: '0.875rem' } }}>
        Viewing as
      </Typography>

      <Chip
        label={`${user?.name} (${user?.role})`}
        size="small"
        sx={{ bgcolor: '#1a2332', color: 'white', fontWeight: 700, fontSize: '0.7rem' }}
      />

      <Box sx={{ flexGrow: 1 }} />

      {originalUser && (
        <Typography variant="caption" sx={{ color: 'rgba(26,35,50,0.7)', display: { xs: 'none', sm: 'block' } }}>
          Admin: {originalUser.name}
        </Typography>
      )}

      <Button
        size="small"
        variant="contained"
        startIcon={<CloseIcon sx={{ fontSize: '0.9rem' }} />}
        onClick={handleStop}
        sx={{
          bgcolor: '#1a2332',
          color: 'white',
          textTransform: 'none',
          fontSize: '0.78rem',
          py: 0.4,
          '&:hover': { bgcolor: '#2d3f5e' },
        }}
      >
        Stop
      </Button>
    </Box>
  );
}
