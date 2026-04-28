import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Box, CircularProgress, TextField,
  InputAdornment, MenuItem, Select, TablePagination, Chip, Skeleton,
  TableSortLabel, Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import { StatusBadge } from '../components/StatusBadge';
import { PageWrapper } from '../components/PageWrapper';
import { usePermission } from '../hooks/usePermission';
import { useDebounce } from '../hooks/useDebounce';
import type { ProjectsParams } from '../types';

const STATUS_OPTIONS = ['', 'ACTIVE', 'INACTIVE', 'CLOSED', 'ON_HOLD'];
const PAGE_SIZE_OPTIONS = [25, 50, 100];
type SortCol = 'project_code' | 'project_name' | 'client_name' | 'status';

export function ProjectsPage() {
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
    <PageWrapper>
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
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" width="80%" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
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
    </PageWrapper>
  );
}
