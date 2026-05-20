import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Box, CircularProgress, TextField,
  InputAdornment, MenuItem, Select, TablePagination, Chip, Skeleton,
  TableSortLabel, Alert, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, IconButton, Snackbar, Autocomplete, Divider,
} from '@mui/material';
import { Search as SearchIcon, Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import { useQuery, keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { projectsApi } from '../api/projects';
import { adminApi } from '../api/admin';
import { StatusBadge } from '../components/StatusBadge';
import { PageWrapper } from '../components/PageWrapper';
import { usePermission } from '../hooks/usePermission';
import { useDebounce } from '../hooks/useDebounce';
import type { ProjectsParams, AssignmentDetail } from '../types';

const STATUS_OPTIONS = ['', 'ACTIVE', 'INACTIVE', 'CLOSED', 'ON_HOLD'];
const PAGE_SIZE_OPTIONS = [25, 50, 100];
type SortCol = 'project_code' | 'project_name' | 'client_name' | 'status';

// ── Projects Admin Tab ────────────────────────────────────────────────────────

function ProjectAdminTab() {
  const navigate  = useNavigate();
  const canCreate = usePermission('survey.create');

  // ── Filter / sort / pagination state ──
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [page,     setPage]     = useState(0);          // MUI TablePagination is 0-indexed
  const [pageSize, setPageSize] = useState(25);
  const [sortBy,   setSortBy]   = useState<SortCol>('project_code');
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('asc');

  const debouncedSearch = useDebounce(search, 350);

  // Track filter changes to reset page
  const prevFiltersRef = useRef({ debouncedSearch, status, sortBy, sortDir });

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const hasFiltersChanged =
      prev.debouncedSearch !== debouncedSearch ||
      prev.status !== status ||
      prev.sortBy !== sortBy ||
      prev.sortDir !== sortDir;

    if (hasFiltersChanged && page !== 0) {
      setPage(0);
    }

    prevFiltersRef.current = { debouncedSearch, status, sortBy, sortDir };
  }, [debouncedSearch, status, sortBy, sortDir, page]);

  const params: ProjectsParams = {
    page:      page + 1,   // backend is 1-indexed
    page_size: pageSize,
    search:    debouncedSearch || undefined,
    status:    status || undefined,
    sort_by:   sortBy,
    sort_dir:  sortDir,
  };

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['projects', params],
    queryFn:  () => projectsApi.getAll(params),
    placeholderData: keepPreviousData,   // keeps previous page visible while loading next
    staleTime: 30_000,                  // 30 s — avoid refetch on every navigation
  });

  const handleSort = useCallback((col: SortCol) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  }, [sortBy]);

  const projects = data?.items ?? [];
  const total    = data?.total ?? 0;
  const loading  = isLoading;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a2332' }}>Projects</Typography>
          {!loading && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
              {total.toLocaleString()} project{total !== 1 ? 's' : ''}
              {isFetching && !loading && (
                <CircularProgress size={10} sx={{ ml: 1 }} />
              )}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Filters row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search code, name or client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: '1 1 260px', maxWidth: 400 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Select
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          displayEmpty
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </Select>
        {(search || status) && (
          <Button
            size="small"
            variant="outlined"
            sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
            onClick={() => { setSearch(''); setStatus(''); }}
          >
            Clear filters
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Chip
          label={`Page ${page + 1} / ${data?.pages ?? '—'}`}
          size="small"
          variant="outlined"
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        />
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>Failed to load projects. Please try again.</Alert>
      )}

      {/* Table */}
      <Box sx={{ overflowX: 'auto' }}>
        <TableContainer component={Paper} elevation={2} sx={{ minWidth: 650 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#1a2332' }}>
              <TableRow>
                {(
                  [
                    { id: 'project_code', label: 'Project Code' },
                    { id: 'project_name', label: 'Project Name' },
                    { id: 'client_name',  label: 'Client' },
                  ] as { id: SortCol; label: string }[]
                ).map(({ id, label }) => (
                  <TableCell key={id} sx={{ color: 'white', fontWeight: 600 }}>
                    <TableSortLabel
                      active={sortBy === id}
                      direction={sortBy === id ? sortDir : 'asc'}
                      onClick={() => handleSort(id)}
                      sx={{
                        color: 'white !important',
                        '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.5) !important' },
                        '&.Mui-active': { color: 'white !important' },
                        '&.Mui-active .MuiTableSortLabel-icon': { color: '#c8102e !important' },
                      }}
                    >
                      {label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Cost Center</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Client Mgr Email</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Delivery Mgr Email</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Project Head</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortBy === 'status' ? sortDir : 'asc'}
                    onClick={() => handleSort('status')}
                    sx={{
                      color: 'white !important',
                      '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.5) !important' },
                      '&.Mui-active .MuiTableSortLabel-icon': { color: '#c8102e !important' },
                    }}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                // Skeleton rows while loading
                Array.from({ length: pageSize < 10 ? pageSize : 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" width="80%" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {search || status ? 'No projects match the current filters.' : 'No projects found.'}
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id} hover sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{project.project_code}</TableCell>
                    <TableCell>{project.project_name}</TableCell>
                    <TableCell>{project.client_name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{project.cost_center}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>{project.client_manager_email ?? '—'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>{project.delivery_manager_email ?? '—'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>{project.project_head_email ?? '—'}</TableCell>
                    <TableCell><StatusBadge status={project.status} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {canCreate && (
                          <Button size="small" variant="contained"
                            sx={{ bgcolor: '#1a2332', textTransform: 'none', whiteSpace: 'nowrap' }}
                            onClick={() => navigate(`/projects/${project.id}/surveys/create`)}>
                            Create Survey
                          </Button>
                        )}
                        <Button size="small" variant="outlined"
                          sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => navigate(`/projects/${project.id}/surveys`)}>
                          View Surveys
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            labelRowsPerPage="Rows:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from.toLocaleString()}–${to.toLocaleString()} of ${count.toLocaleString()}`
            }
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        </TableContainer>
      </Box>
    </Box>
  );
}

// ── Project Users Tab (Assignments) ───────────────────────────────────────────

function ProjectUsersTab() {
  const qc = useQueryClient();
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newUserId, setNewUserId]   = useState<number | null>(null);
  const [newProject, setNewProject] = useState('');
  const [newStart, setNewStart]     = useState('');
  const [newEnd, setNewEnd]         = useState('');

  // Edit dialog
  const [editTarget, setEditTarget] = useState<AssignmentDetail | null>(null);
  const [editStart, setEditStart]   = useState('');
  const [editEnd, setEditEnd]       = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AssignmentDetail | null>(null);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['admin-assignments'], queryFn: adminApi.getAssignments,
  });
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'], queryFn: adminApi.getUsers,
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createAssignment(newUserId!, newProject, newStart, newEnd || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-assignments'] });
      setToast('Assignment created');
      setCreateOpen(false);
      setNewUserId(null); setNewProject(''); setNewStart(''); setNewEnd('');
    },
    onError: (e: Error) => setErrorMsg((e as AxiosError<{ detail: string }>)?.response?.data?.detail ?? 'Failed to create assignment'),
  });

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateAssignment(editTarget!.id, editStart || undefined, editEnd || null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-assignments'] });
      setToast('Assignment updated');
      setEditTarget(null);
    },
    onError: (e: Error) => setErrorMsg((e as AxiosError<{ detail: string }>)?.response?.data?.detail ?? 'Failed to update assignment'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteAssignment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-assignments'] });
      setToast('Assignment removed');
      setDeleteTarget(null);
    },
    onError: (e: Error) => setErrorMsg((e as AxiosError<{ detail: string }>)?.response?.data?.detail ?? 'Failed to delete assignment'),
  });

  const openCreate = () => {
    setErrorMsg('');
    setNewUserId(null); setNewProject(''); setNewStart(''); setNewEnd('');
    setCreateOpen(true);
  };

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      {/* Header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Manage which users have access to which projects.
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}
          sx={{ bgcolor: '#1a2332', textTransform: 'none' }}
          onClick={openCreate}>
          New Assignment
        </Button>
      </Box>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

      {/* Table */}
      <Box sx={{ overflowX: 'auto' }}>
        <TableContainer component={Paper} elevation={2} sx={{ minWidth: 650 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#1a2332' }}>
              <TableRow>
                {['User', 'Email', 'Project Code', 'Start Date', 'End Date', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No assignments yet — click "New Assignment" to add one.
                  </TableCell>
                </TableRow>
              )}
              {assignments.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{a.user_name}</TableCell>
                  <TableCell sx={{ color: '#4b5563', fontSize: '0.82rem' }}>{a.user_email}</TableCell>
                  <TableCell>
                    <Chip label={a.project_code} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {a.start_date ? new Date(a.start_date).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {a.end_date
                      ? new Date(a.end_date).toLocaleDateString()
                      : <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Open</Typography>}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit dates">
                        <IconButton size="small"
                          onClick={() => {
                            setEditTarget(a);
                            setEditStart(a.start_date?.slice(0, 10) ?? '');
                            setEditEnd(a.end_date?.slice(0, 10) ?? '');
                            setErrorMsg('');
                          }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error"
                          sx={{ border: '1px solid', borderColor: 'error.light' }}
                          onClick={() => setDeleteTarget(a)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
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
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Assignment</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Autocomplete
            options={users}
            getOptionLabel={(u) => `${u.name} — ${u.email}`}
            onChange={(_, v) => setNewUserId(v?.id ?? null)}
            renderInput={(params) => <TextField {...params} label="User" size="small" />}
            renderOption={(props, u) => (
              <Box component="li" {...props} key={u.id}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{u.email}</Typography>
                </Box>
              </Box>
            )}
          />
          <TextField
            label="Project code" size="small" value={newProject}
            onChange={(e) => setNewProject(e.target.value.toUpperCase())}
            placeholder="e.g. PRJ-1001"
          />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Start date" type="date" size="small" sx={{ flex: 1, minWidth: 160 }}
              value={newStart} onChange={(e) => setNewStart(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="End date (optional)" type="date" size="small" sx={{ flex: 1, minWidth: 160 }}
              value={newEnd} onChange={(e) => setNewEnd(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained" startIcon={<SaveIcon />}
            disabled={!newUserId || !newProject.trim() || !newStart || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Edit Assignment
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {editTarget?.user_name} → {editTarget?.project_code}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Start date" type="date" size="small" value={editStart}
            onChange={(e) => setEditStart(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="End date (optional)" type="date" size="small" value={editEnd}
            onChange={(e) => setEditEnd(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="Clear this field to set an open-ended assignment"
          />
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button
            variant="contained" startIcon={<SaveIcon />}
            disabled={!editStart || updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Assignment</DialogTitle>
        <DialogContent>
          <Typography>
            Remove <strong>{deleteTarget?.user_name}</strong> from project <strong>{deleteTarget?.project_code}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error"
            disabled={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ProjectsPage() {
  const [tab, setTab] = useState(0);

  return (
    <PageWrapper>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 2 }}>
        Projects
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Project Admin" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab label="Project Users" sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>

      <Divider sx={{ mb: 3 }} />

      {tab === 0 && <ProjectAdminTab />}
      {tab === 1 && <ProjectUsersTab />}
    </PageWrapper>
  );
}
