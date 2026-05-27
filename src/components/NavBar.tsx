import { useState, useMemo } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Chip,
  IconButton, Drawer, List, ListItem, ListItemButton,
  ListItemText, Divider, useMediaQuery, useTheme,
  Menu, MenuItem, Collapse,
} from '@mui/material';
import { Menu as MenuIcon, Logout as LogoutIcon, ExpandLess, ExpandMore } from '@mui/icons-material';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useAuthStore } from '../store/authStore';
import { ROLE_COLORS } from '../constants/roles';

interface NavLink {
  label: string;
  to?: string;
  perm: string | null;
  submenu?: NavLink[];
}

const NAV_LINKS_CONFIG: NavLink[] = [
  { label: 'Home',          to: '/home',          perm: null },
  { label: 'Questions',     to: '/questions',     perm: 'project.view' },
  { label: 'Survey Management', perm: 'survey.create', submenu: [
    { label: 'Create Survey',  to: '/surveys/create',     perm: 'survey.create' },
    { label: 'Consult Survey', to: '/surveys/consult',    perm: 'survey.create' },
    { label: 'Projects',       to: '/projects',           perm: 'project.view' },
    { label: 'Control Tower',  to: '/control-tower',      perm: 'results.view' },
  ]},
  { label: 'Users',         to: '/admin/users',   perm: 'users.manage' },
  { label: 'Roles',         to: '/admin/roles',   perm: 'roles.manage' },
];


export function NavBar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submenuAnchor, setSubmenuAnchor] = useState<null | HTMLElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { instance } = useMsal();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const visibleLinks = useMemo(
    () => NAV_LINKS_CONFIG.filter(({ perm }) => !perm || hasPermission(perm)).map(link => ({
      ...link,
      submenu: link.submenu?.filter(({ perm }) => !perm || hasPermission(perm))
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasPermission]
  );

  const handleLogout = async () => {
    setDrawerOpen(false);
    clearAuth();
    await instance.logoutRedirect({ postLogoutRedirectUri: '/login' });
  };

  const isActive = (to?: string) => to ? location.pathname.startsWith(to) : false;

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: 'var(--color-navy)' }}>
        <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }}>

          {/* Brand */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', flexShrink: 0, mr: { xs: 1, md: 4 } }}
            onClick={() => navigate('/home')}
          >
            <Box sx={{ width: 18, height: 18, bgcolor: '#d1d5db', flexShrink: 0 }} />
            <Box sx={{ lineHeight: 1, display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ color: 'var(--color-text-light)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', lineHeight: 1.3, display: 'block' }}>
                GFT TECHNOLOGIES
              </Typography>
              
            </Box>
            <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(255,255,255,0.2)', mx: 0.5, display: { xs: 'none', sm: 'block' } }} />
            <Typography sx={{ color: 'var(--navbar-link-active)', fontWeight: 700, fontSize: { xs: '0.95rem', md: '1rem' } }}>
              Survey Core
            </Typography>
          </Box>

          {/* Desktop nav links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
              {visibleLinks.map(({ label, to, submenu }) => (
                <Box key={label}>
                  {submenu ? (
                    <>
                      <Button
                        onMouseEnter={(e) => {
                          setActiveSubmenu(label);
                          setSubmenuAnchor(e.currentTarget);
                        }}
                        sx={{
                          color: activeSubmenu === label ? 'var(--navbar-link-active)' : 'rgba(255,255,255,0.85)',
                          fontWeight: activeSubmenu === label ? 700 : 400,
                          textTransform: 'none',
                          fontSize: '0.875rem',
                        }}
                      >
                        {label}
                      </Button>
                      <Menu
                        anchorEl={activeSubmenu === label ? submenuAnchor : null}
                        open={activeSubmenu === label}
                        onClose={() => setActiveSubmenu(null)}
                        slotProps={{
                          paper: {
                            onMouseLeave: () => setActiveSubmenu(null),
                            sx: {
                              bgcolor: 'var(--menu-bg)',
                              borderRadius: 'var(--menu-border-radius)',
                              marginTop: 'var(--menu-margin-top)',
                              boxShadow: 'var(--menu-shadow)',
                              border: 'none',
                              minWidth: 'var(--menu-min-width)',
                            }
                          }
                        }}
                        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                      >
                        {submenu.map(({ label: sublabel, to: subto }) => (
                          <MenuItem
                            key={subto}
                            onClick={() => {
                              navigate(subto!);
                              setActiveSubmenu(null);
                            }}
                            sx={{
                              color: 'var(--menu-text) !important',
                              fontSize: 'var(--menu-font-size)',
                              padding: 'var(--menu-padding)',
                              bgcolor: 'var(--menu-bg) !important',
                              '&:hover': {
                                bgcolor: 'var(--menu-hover-bg) !important',
                                color: 'var(--menu-hover-text) !important',
                              },
                              '&.Mui-selected': {
                                bgcolor: 'var(--menu-selected-bg) !important',
                                color: 'var(--menu-selected-text) !important',
                              },
                              '&.Mui-selected:hover': {
                                bgcolor: 'var(--menu-selected-hover-bg) !important',
                                color: 'var(--menu-selected-hover-text) !important',
                              },
                              '&.Mui-focusVisible': {
                                bgcolor: 'var(--menu-hover-bg) !important',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {sublabel}
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  ) : (
                    <Button
                      component={NavLink}
                      to={to!}
                      sx={{
                        color: isActive(to) ? 'var(--navbar-link-active)' : 'rgba(255,255,255,0.85)',
                        fontWeight: isActive(to) ? 700 : 400,
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        '&.active': { color: 'var(--navbar-link-active)', fontWeight: 700 },
                      }}
                    >
                      {label}
                    </Button>
                  )}
                </Box>
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
            <Box sx={{ bgcolor: 'var(--color-navy)', p: 2 }}>
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
            {visibleLinks.map(({ label, to, submenu }) => (
              <Box key={label}>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={to ? isActive(to) : false}
                    onClick={() => {
                      if (submenu) {
                        setExpandedMobile(expandedMobile === label ? null : label);
                      } else {
                        navigate(to!);
                        setDrawerOpen(false);
                      }
                    }}
                    sx={{ '&.Mui-selected': { bgcolor: 'var(--navbar-drawer-selected-bg)', color: 'var(--navbar-drawer-selected-color)', fontWeight: 700 } }}
                  >
                    <ListItemText primary={label} slotProps={{ primary: { sx: { fontSize: '0.9rem' } } }} />
                    {submenu && (expandedMobile === label ? <ExpandLess /> : <ExpandMore />)}
                  </ListItemButton>
                </ListItem>
                {submenu && (
                  <Collapse in={expandedMobile === label} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {submenu.map(({ label: sublabel, to: subto }) => (
                        <ListItem key={subto} disablePadding sx={{ pl: 4 }}>
                          <ListItemButton
                            onClick={() => {
                              navigate(subto!);
                              setDrawerOpen(false);
                              setExpandedMobile(null);
                            }}
                          >
                            <ListItemText primary={sublabel} slotProps={{ primary: { sx: { fontSize: '0.9rem' } } }} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                )}
              </Box>
            ))}
          </List>

          <Divider />

          {/* Logout */}
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ color: 'var(--navbar-logout-color)' }}>
              <LogoutIcon sx={{ mr: 1, fontSize: 18 }} />
              <ListItemText primary={<Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>Logout</Typography>} />
            </ListItemButton>
          </ListItem>
        </Box>
      </Drawer>
    </>
  );
}
