import { useState, useMemo } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Chip,
  IconButton, Drawer, List, ListItem, ListItemButton,
  ListItemText, Divider, useMediaQuery, useTheme,
} from '@mui/material';
import { Menu as MenuIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useAuthStore } from '../store/authStore';
import { ROLE_COLORS } from '../constants/roles';

const NAV_LINKS_CONFIG = [
  { label: 'Home',          to: '/home',          perm: null },
  { label: 'Questions',     to: '/questions',     perm: 'project.view' },
  { label: 'Projects',      to: '/projects',      perm: 'project.view' },
  { label: 'Control Tower', to: '/control-tower', perm: 'results.view' },
  { label: 'Users',         to: '/admin/users',   perm: 'users.manage' },
  { label: 'Roles',         to: '/admin/roles',   perm: 'roles.manage' },
] as const;


export function NavBar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { instance } = useMsal();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const visibleLinks = useMemo(
    () => NAV_LINKS_CONFIG.filter(({ perm }) => !perm || hasPermission(perm)),
    // hasPermission is stable (Zustand selector), re-runs only when user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasPermission]
  );

  const handleLogout = async () => {
    setDrawerOpen(false);
    clearAuth();
    await instance.logoutRedirect({ postLogoutRedirectUri: '/login' });
  };

  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: '#1a2332' }}>
        <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }}>

          {/* Brand */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', flexShrink: 0, mr: { xs: 1, md: 4 } }}
            onClick={() => navigate('/home')}
          >
            <Box sx={{ width: 18, height: 18, bgcolor: '#c8102e', flexShrink: 0 }} />
            <Box sx={{ lineHeight: 1, display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', lineHeight: 1.3, display: 'block' }}>
                GFT TECHNOLOGIES
              </Typography>
              
            </Box>
            <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(255,255,255,0.2)', mx: 0.5, display: { xs: 'none', sm: 'block' } }} />
            <Typography sx={{ color: '#c8102e', fontWeight: 700, fontSize: { xs: '0.95rem', md: '1rem' } }}>
              Survey Core
            </Typography>
          </Box>

          {/* Desktop nav links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
              {visibleLinks.map(({ label, to }) => (
                <Button
                  key={to}
                  component={NavLink}
                  to={to}
                  sx={{
                    color: isActive(to) ? '#c8102e' : 'rgba(255,255,255,0.85)',
                    fontWeight: isActive(to) ? 700 : 400,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    '&.active': { color: '#c8102e', fontWeight: 700 },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          )}

          {isMobile && <Box sx={{ flexGrow: 1 }} />}

          {/* Desktop user info */}
          {!isMobile && user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
              <Chip
                label={user.role}
                size="small"
                sx={{ bgcolor: ROLE_COLORS[user.role] ?? '#6b7280', color: 'white', fontWeight: 700, fontSize: '0.62rem', height: 20 }}
              />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.35)', textTransform: 'none', fontSize: '0.8rem' }}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)} edge="end">
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* User info */}
          {user && (
            <Box sx={{ bgcolor: '#1a2332', p: 2 }}>
              <Chip
                label={user.role}
                size="small"
                sx={{ bgcolor: ROLE_COLORS[user.role] ?? '#6b7280', color: 'white', fontWeight: 700, mb: 0.5 }}
              />
              <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem' }}>{user.email}</Typography>
            </Box>
          )}

          <Divider />

          {/* Nav links */}
          <List sx={{ flexGrow: 1 }}>
            {visibleLinks.map(({ label, to }) => (
              <ListItem key={to} disablePadding>
                <ListItemButton
                  selected={isActive(to)}
                  onClick={() => { navigate(to); setDrawerOpen(false); }}
                  sx={{ '&.Mui-selected': { bgcolor: '#fff0f2', color: '#c8102e', fontWeight: 700 } }}
                >
                  <ListItemText primary={label} slotProps={{ primary: { sx: { fontSize: '0.9rem' } } }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider />

          {/* Logout */}
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ color: '#c8102e' }}>
              <LogoutIcon sx={{ mr: 1, fontSize: 18 }} />
              <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
        </Box>
      </Drawer>
    </>
  );
}
