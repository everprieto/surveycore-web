import { Box, Typography, Button } from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 2, px: 2 }}>
      <LockOutlinedIcon sx={{ fontSize: { xs: 48, md: 64 }, color: '#c8102e' }} />
      <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '2rem', md: '3rem' } }}>
        403
      </Typography>
      <Typography variant="h6" sx={{ color: 'text.secondary', textAlign: 'center', fontSize: { xs: '1rem', md: '1.25rem' } }}>
        You don't have permission to access this page.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant="contained" color="primary" onClick={() => navigate('/home')}>
          Go to Home
        </Button>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    </Box>
  );
}
