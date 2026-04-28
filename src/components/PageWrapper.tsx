import type { ReactNode } from 'react';
import { Container, Box } from '@mui/material';
import { NavBar } from './NavBar';

interface Props {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function PageWrapper({ children, maxWidth = 'xl' }: Props) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <NavBar />
      <Container maxWidth={maxWidth} sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        {children}
      </Container>
    </Box>
  );
}
