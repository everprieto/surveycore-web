import { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Tooltip, CircularProgress, Alert,
  Checkbox, FormControlLabel, FormGroup, Snackbar, Divider, Select, MenuItem,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon, Lock as LockIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { adminApi } from '../../api/admin';
import { PageWrapper } from '../../components/PageWrapper';
import { roleColor } from '../../constants/roles';
import type { RoleDetail } from '../../types';

// ── Tab 0: Roles CRUD ─────────────────────────────────────────────────────────

function RolesCrud() {
  const qc = useQueryClient();
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: roles = [], isLoading } = useQuery({ queryKey: ['admin-roles'], queryFn: adminApi.getRoles });

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const [editRole, setEditRole] = useState<RoleDetail | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editName, setEditName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<RoleDetail | null>(null);

  const createMutation = useMutation({
    mutationFn: () => adminApi.createRole(newName, newDesc || undefined),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin-roles'] });
      setToast(`Role '${r.role_name}' created`);
      setCreateOpen(false); setNewName(''); setNewDesc('');
    },
    onError: (e: Error) => setErrorMsg((e as AxiosError<{ detail: string }>)?.response?.data?.detail ?? 'Failed to create role'),
  });

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateRole(editRole!.role_id, {
      description: editDesc || undefined,
      role_name: !editRole!.is_system ? editName || undefined : undefined,
    }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin-roles'] });
      setToast(`Role '${r.role_name}' updated`);
      setEditRole(null);
    },
    onError: (e: Error) => setErrorMsg((e as AxiosError<{ detail: string }>)?.response?.data?.detail ?? 'Failed to update role'),
  });

  const deleteMutation = useMutation({
    mutationFn: (roleId: number) => adminApi.deleteRole(roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-roles'] });
      setToast('Role deleted');
      setDeleteTarget(null);
    },
    onError: (e: Error) => {
      setErrorMsg((e as AxiosError<{ detail: string }>)?.response?.data?.detail ?? 'Failed to delete role');
      setDeleteTarget(null);
    },
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          System roles cannot be renamed or deleted.
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}
          sx={{ bgcolor: '#1a2332', textTransform: 'none' }}
          onClick={() => { setCreateOpen(true); setErrorMsg(''); }}>
          New Role
        </Button>
      </Box>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

      <Box sx={{ overflowX: 'auto' }}>
        <TableContainer component={Paper} elevation={2} sx={{ minWidth: 600 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#1a2332' }}>
              <TableRow>
                {['Name', 'Description', 'Users', 'Permissions', 'Type', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.role_id} hover>
                  <TableCell>
                    <Chip label={r.role_name} size="small"
                      sx={{ bgcolor: roleColor(r.role_name), color: 'white', fontWeight: 700, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell sx={{ color: '#4b5563', fontSize: '0.82rem' }}>
                    {r.description ?? <em style={{ color: '#9ca3af' }}>No description</em>}
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={r.user_count} size="small" color={r.user_count > 0 ? 'primary' : 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={r.permissions.length} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    {r.is_system
                      ? <Chip label="System" size="small" icon={<LockIcon />} sx={{ fontSize: '0.65rem' }} />
                      : <Chip label="Custom" size="small" color="secondary" variant="outlined" sx={{ fontSize: '0.65rem' }} />}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small"
                          onClick={() => { setEditRole(r); setEditDesc(r.description ?? ''); setEditName(r.role_name); setErrorMsg(''); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={r.is_system ? 'System role' : r.user_count > 0 ? `${r.user_count} user(s) assigned` : 'Delete'}>
                        <span>
                          <IconButton size="small" color="error"
                            disabled={r.is_system || r.user_count > 0}
                            onClick={() => setDeleteTarget(r)}
                            sx={{ border: '1px solid', borderColor: 'error.light' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Role name" size="small" fullWidth
            value={newName} onChange={(e) => setNewName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
            helperText="Uppercase letters, numbers and underscores only" />
          <TextField label="Description (optional)" size="small" fullWidth
            value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateOpen(false); setNewName(''); setNewDesc(''); }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#1a2332' }}
            disabled={!newName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editRole} onClose={() => setEditRole(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Role — {editRole?.role_name}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {!editRole?.is_system && (
            <TextField label="Role name" size="small" fullWidth
              value={editName} onChange={(e) => setEditName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))} />
          )}
          <TextField label="Description" size="small" fullWidth multiline rows={2}
            value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRole(null)}>Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon />}
            disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the role <strong>{deleteTarget?.role_name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.role_id)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

// ── Tab 1: Permissions per Role ───────────────────────────────────────────────

function PermissionsTab() {
  const qc = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [localPerms, setLocalPerms] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: roles = [] } = useQuery({ queryKey: ['admin-roles'], queryFn: adminApi.getRoles });
  const { data: allPerms = [] } = useQuery({ queryKey: ['admin-permissions'], queryFn: adminApi.getPermissions });

  const selectedRole = roles.find((r) => r.role_id === selectedRoleId);

  const handleSelectRole = (roleId: number) => {
    setSelectedRoleId(roleId);
    const role = roles.find((r) => r.role_id === roleId);
    setLocalPerms(new Set(role?.permissions ?? []));
    setErrorMsg('');
  };

  const saveMutation = useMutation({
    mutationFn: () => adminApi.setRolePermissions(selectedRoleId as number, [...localPerms]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-roles'] });
      setToast('Permissions saved successfully');
    },
    onError: (e: Error) => setErrorMsg((e as AxiosError<{ detail: string }>)?.response?.data?.detail ?? 'Failed to save permissions'),
  });

  const toggle = (code: string) => {
    setLocalPerms((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const domains = [...new Set(allPerms.map((p) => p.code.split('.')[0]))].sort();

  return (
    <Box>
      {/* Role selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="body1" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Select Role:</Typography>
        <Select
          size="small"
          value={selectedRoleId}
          onChange={(e) => handleSelectRole(e.target.value as number)}
          displayEmpty
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="" disabled>— Choose a role —</MenuItem>
          {roles.map((r) => (
            <MenuItem key={r.role_id} value={r.role_id}>
              <Chip label={r.role_name} size="small"
                sx={{ bgcolor: roleColor(r.role_name), color: 'white', fontWeight: 700, fontSize: '0.68rem', mr: 1 }} />
              {r.description}
            </MenuItem>
          ))}
        </Select>
        {selectedRole && (
          <Chip label={`${localPerms.size} / ${allPerms.length} permissions`}
            size="small" color="primary" variant="outlined" />
        )}
      </Box>

      {!selectedRoleId && (
        <Alert severity="info">Select a role to view and edit its permissions.</Alert>
      )}

      {selectedRoleId && (
        <>
          {errorMsg && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

          {/* Permissions grouped by domain */}
          {domains.map((domain) => {
            const domPerms = allPerms.filter((p) => p.code.startsWith(domain + '.'));
            return (
              <Paper key={domain} elevation={1} sx={{ mb: 2, overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1, bgcolor: '#1a2332', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {domain}
                  </Typography>
                  <Chip
                    label={`${domPerms.filter((p) => localPerms.has(p.code)).length} / ${domPerms.length}`}
                    size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.65rem' }}
                  />
                </Box>
                <Box sx={{ px: 2, py: 1 }}>
                  <FormGroup>
                    {domPerms.map((perm) => (
                      <FormControlLabel
                        key={perm.code}
                        control={
                          <Checkbox
                            size="small"
                            checked={localPerms.has(perm.code)}
                            onChange={() => toggle(perm.code)}
                            disabled={selectedRole?.role_name === 'ADMIN'}
                            sx={{ '&.Mui-checked': { color: roleColor(selectedRole?.role_name ?? '') } }}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{perm.code}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{perm.description}</Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                </Box>
              </Paper>
            );
          })}

          {selectedRole?.role_name !== 'ADMIN' && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button variant="contained" startIcon={<SaveIcon />}
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                sx={{ bgcolor: roleColor(selectedRole?.role_name ?? ''), textTransform: 'none' }}>
                Save permissions for {selectedRole?.role_name}
              </Button>
            </Box>
          )}
          {selectedRole?.role_name === 'ADMIN' && (
            <Alert severity="info" icon={<LockIcon />}>
              ADMIN role permissions cannot be modified.
            </Alert>
          )}
        </>
      )}

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function RolesPage() {
  const [tab, setTab] = useState(0);

  return (
    <PageWrapper>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 2 }}>
        Role & Permission Management
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Roles" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab label="Permissions" sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>

      <Divider sx={{ mb: 3 }} />

      {tab === 0 && <RolesCrud />}
      {tab === 1 && <PermissionsTab />}
    </PageWrapper>
  );
}
