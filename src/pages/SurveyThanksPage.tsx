import { Box, Typography, Container } from '@mui/material';

export function SurveyThanksPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography variant="h1" sx={{ mb: 2 }}>✅</Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a2332', mb: 2 }}>
          Thank You!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your survey response has been recorded. We appreciate your time and feedback.
        </Typography>
        <Box sx={{ width: 60, height: 4, bgcolor: '#c8102e', mx: 'auto', mt: 3 }} />
      </Container>
    </Box>
  );
}
