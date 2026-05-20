import { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Select, MenuItem, Chip, IconButton, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Tooltip, CircularProgress, Alert,
  Snackbar, Autocomplete,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Visibility as ViewAsIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { adminApi } from '../../api/admin';
import { PageWrapper } from '../../components/PageWrapper';
import { useAuthStore } from '../../store/authStore';
import { roleColor } from '../../constants/roles';
import type { LegalEntity, UserLegalEntityRow } from '../../types';

// ── Tab 0: User Management (role assignment) ──────────────────────────────────

function UserManagementTab() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const startImpersonation = useAuthStore((s) => s.startImpersonation);
  const currentUser = useAuthStore((s) => s.user);

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['admin-users'], queryFn: adminApi.getUsers, staleTime: 60_000,
  });
  const { data: roles = [] } = useQuery({
    queryKey: ['admin-roles'], queryFn: adminApi.getRoles, staleTime: 60_000,
  });

  const rolesMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      adminApi.setUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const impersonateMutation = useMutation({
    mutationFn: (userId: number) => adminApi.impersonate(userId),
    onSuccess: (data) => {
      startImpersonation(data.access_token, data.user);
      navigate('/home');
    },
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (isError)   return <Alert severity="error">Failed to load users.</Alert>;

  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Assign roles to users. Use <strong>View as</strong> to browse the application as that user.
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <TableContainer component={Paper} elevation={2} sx={{ minWidth: 560 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#1a2332' }}>
              <TableRow>
                {['Name', 'Email', 'Role', 'View as'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => {
                const isSelf   = u.id === currentUser?.id;
                const isAdmin  = u.role === 'ADMIN';
                const canView  = !isSelf && !isAdmin;
                return (
                  <TableRow key={u.id} hover>
                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{u.name}</TableCell>
                    <TableCell sx={{ color: '#4b5563', fontSize: '0.82rem' }}>{u.email}</TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={u.role ?? ''}
                        onChange={(e) => rolesMutation.mutate({ userId: u.id, role: e.target.value })}
                        sx={{ fontSize: '0.82rem', minWidth: 165 }}
                      >
                        {roles.map((r) => (
                          <MenuItem key={r.role_id} value={r.role_name}>
                            <Chip
                              label={r.role_name}
                              size="small"
                              sx={{ bgcolor: roleColor(r.role_name), color: 'white', fontWeight: 700, fontSize: '0.68rem' }}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={isSelf ? 'This is you' : isAdmin ? 'Cannot impersonate ADMIN' : `View app as ${u.name}`}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={!canView || impersonateMutation.isPending}
                            onClick={() => impersonateMutation.mutate(u.id)}
                            sx={{
                              color: canView ? '#2563eb' : 'text.disabled',
                              border: '1px solid',
                              borderColor: canView ? '#bfdbfe' : 'divider',
                              '&:hover': canView ? { bgcolor: '#eff6ff' } : {},
                            }}
                          >
                            <ViewAsIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

// ── Tab 1: Legal Entities & User Assignments ──────────────────────────────────

function LegalEntityTab() {
  const qc = useQueryClient();
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Legal Entity dialogs
  const [leCreateOpen, setLeCreateOpen] = useState(false);
  const [leNewName, setLeNewName] = useState('');
  const [leDeleteTarget, setLeDeleteTarget] = useState<LegalEntity | null>(null);

  // User Legal Entity dialogs
  const [uleLinkOpen, setUleLinkOpen] = useState(false);
  const [uleNewUserId, setUleNewUserId] = useState<number | null>(null);
  const [uleNewLegalEntityId, setUleNewLegalEntityId] = useState<number | null>(null);
  const [uleDeleteTarget, setUleDeleteTarget] = useState<UserLegalEntityRow | null>(null);

  const { data: legalEntities = [], isLoading: leLoading } = useQuery({
    queryKey: ['admin-legal-entities'],
    queryFn: adminApi.getLegalEntities,
  });

  const { data: userLegalEntities = [], isLoading: uleLoading } = useQuery({
    queryKey: ['admin-user-legal-entities'],
    queryFn: adminApi.getUserLegalEntities,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApi.getUsers,
  });

  // Create Legal Entity mutation
  const leCreateMutation = useMutation({
    mutationFn: () => adminApi.createLegalEntity(leNewName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-legal-entities'] });
      setToast('Legal entity created');
      setLeCreateOpen(false);
      setLeNewName('');
    },
    onError: (e: Error) => setErrorMsg((e as AxiosError<{ detail: string }>)?.response?.data?.detail ?? 'Failed to create'),
  });

  // Delete Legal Entity mutation
  const leDeleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteLegalEntity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-legal-entities'] });
      setToast('Legal entity deleted');
      setLeDeleteTarget(null);
    },
    onError: (e: Error) => setErrorMsg((e as AxiosError<{ detail: string }>)?.response?.data?.detail ?? 'Failed to delete'),
  });

  // Create User Legal Entity mutation
  const uleLinkMutation = useMutation({
    mutationFn: () => adminApi.createUserLegalEntity(uleNewUserId!, uleNewLegalEntityId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-legal-entities'] });
      setToast('User linked to legal entity');
      setUleLinkOpen(false);
      setUleNewUserId(null);
      setUleNewLegalEntityId(null);
    },
    onError: (e: Error) => setErrorMsg((e as AxiosError<{ detail: string }>)?.response?.data?.detail ?? 'Failed to link'),
  });

  // Delete User Legal Entity mutation
  const uleDeleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUserLegalEntity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-legal-entities'] });
      setToast('Link removed');
      setUleDeleteTarget(null);
    },
    onError: (e: Error) => setErrorMsg((e as AxiosError<{ detail: string }>)?.response?.data?.detail ?? 'Failed to remove'),
  });

  if (leLoading || uleLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Section 1: Legal Entities */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Legal Entities</Typography>
          <Button variant="contained" startIcon={<AddIcon />}
            sx={{ bgcolor: '#1a2332', textTransform: 'none' }}
            onClick={() => { setErrorMsg(''); setLeCreateOpen(true); }}>
            New Legal Entity
          </Button>
        </Box>
        {errorMsg && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}
        <Box sx={{ overflowX: 'auto' }}>
          <TableContainer component={Paper} elevation={2} sx={{ minWidth: 400 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#1a2332' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {legalEntities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No legal entities yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  legalEntities.map((le) => (
                    <TableRow key={le.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{le.name}</TableCell>
                      <TableCell>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error"
                            sx={{ border: '1px solid', borderColor: 'error.light' }}
                            onClick={() => setLeDeleteTarget(le)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* Section 2: User ↔ Legal Entity */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>User ↔ Legal Entity</Typography>
          <Button variant="contained" startIcon={<AddIcon />}
            sx={{ bgcolor: '#1a2332', textTransform: 'none' }}
            onClick={() => { setErrorMsg(''); setUleLinkOpen(true); }}>
            Link User
          </Button>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <TableContainer component={Paper} elevation={2} sx={{ minWidth: 500 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#1a2332' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Legal Entity</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userLegalEntities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No links yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  userLegalEntities.map((ule) => (
                    <TableRow key={ule.id} hover>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{ule.user_name}</TableCell>
                      <TableCell sx={{ color: '#4b5563', fontSize: '0.82rem' }}>{ule.user_email}</TableCell>
                      <TableCell><Chip label={ule.legal_entity_name} size="small" variant="outlined" sx={{ fontWeight: 600 }} /></TableCell>
                      <TableCell>
                        <Tooltip title="Remove link">
                          <IconButton size="small" color="error"
                            sx={{ border: '1px solid', borderColor: 'error.light' }}
                            onClick={() => setUleDeleteTarget(ule)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* Dialogs */}

      {/* Create Legal Entity */}
      <Dialog open={leCreateOpen} onClose={() => setLeCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Legal Entity</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Name" size="small" value={leNewName}
            onChange={(e) => setLeNewName(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeCreateOpen(false)}>Cancel</Button>
          <Button variant="contained"
            disabled={!leNewName.trim() || leCreateMutation.isPending}
            onClick={() => leCreateMutation.mutate()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Legal Entity Confirm */}
      <Dialog open={!!leDeleteTarget} onClose={() => setLeDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Legal Entity</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{leDeleteTarget?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error"
            disabled={leDeleteMutation.isPending}
            onClick={() => leDeleteTarget && leDeleteMutation.mutate(leDeleteTarget.id)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Link User to Legal Entity */}
      <Dialog open={uleLinkOpen} onClose={() => setUleLinkOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Link User to Legal Entity</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Autocomplete
            options={users}
            getOptionLabel={(u) => `${u.name} — ${u.email}`}
            onChange={(_, v) => setUleNewUserId(v?.id ?? null)}
            renderInput={(params) => <TextField {...params} label="User" size="small" />}
          />
          <Autocomplete
            options={legalEntities}
            getOptionLabel={(le) => le.name}
            onChange={(_, v) => setUleNewLegalEntityId(v?.id ?? null)}
            renderInput={(params) => <TextField {...params} label="Legal Entity" size="small" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUleLinkOpen(false)}>Cancel</Button>
          <Button variant="contained"
            disabled={!uleNewUserId || !uleNewLegalEntityId || uleLinkMutation.isPending}
            onClick={() => uleLinkMutation.mutate()}>
            Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Link Confirm */}
      <Dialog open={!!uleDeleteTarget} onClose={() => setUleDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Link</DialogTitle>
        <DialogContent>
          <Typography>
            Remove <strong>{uleDeleteTarget?.user_name}</strong> from <strong>{uleDeleteTarget?.legal_entity_name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUleDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error"
            disabled={uleDeleteMutation.isPending}
            onClick={() => uleDeleteTarget && uleDeleteMutation.mutate(uleDeleteTarget.id)}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function UsersPage() {
  const [tab, setTab] = useState(0);

  return (
    <PageWrapper>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 2 }}>
        User Administration
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="User Management" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab label="User Legal Entity" sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>

      <Divider sx={{ mb: 3 }} />

      {tab === 0 && <UserManagementTab />}
      {tab === 1 && <LegalEntityTab />}
    </PageWrapper>
  );
}
