import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Typography, Paper, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress,
  LinearProgress, Button, TextField, InputAdornment,
  Select, MenuItem, TablePagination, TableSortLabel,
  Skeleton, Alert, Chip,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { resultsApi } from '../api/results';
import { StatusBadge } from '../components/StatusBadge';
import { PageWrapper } from '../components/PageWrapper';
import { useDebounce } from '../hooks/useDebounce';
import type { ControlTowerParams } from '../types';

const SURVEY_STATUSES = ['DRAFT', 'ACTIVE', 'CLOSED', 'COMPLETED'];
const LANGUAGES       = ['EN', 'ES', 'DEU', 'FR', 'PT'];
const PAGE_SIZES      = [25, 50, 100];

type SortCol = 'project_code' | 'project_name' | 'survey_type' | 'survey_status' | 'sent_count' | 'done_count' | 'last_response';

export function ControlTowerPage() {
  const navigate = useNavigate();

  const [search,        setSearch]        = useState('');
  const [surveyStatus,  setSurveyStatus]  = useState('');
  const [langCode,      setLangCode]      = useState('');
  const [page,          setPage]          = useState(0);
  const [pageSize,      setPageSize]      = useState(25);
  const [sortBy,        setSortBy]        = useState<SortCol>('project_code');
  const [sortDir,       setSortDir]       = useState<'asc' | 'desc'>('asc');

  const debouncedSearch = useDebounce(search, 350);
  useEffect(() => setPage(0), [debouncedSearch, surveyStatus, langCode, sortBy, sortDir]);

  const params: ControlTowerParams = {
    page:          page + 1,
    page_size:     pageSize,
    search:        debouncedSearch || undefined,
    survey_status: surveyStatus   || undefined,
    language_code: langCode       || undefined,
    sort_by:       sortBy,
    sort_dir:      sortDir,
  };

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey:        ['control-tower', params],
    queryFn:         () => resultsApi.getControlTower(params),
    placeholderData: keepPreviousData,
    staleTime:       30_000,
  });

  const handleSort = useCallback((col: SortCol) => {
    setSortBy((prev) => { if (prev === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); return col; });
    if (sortBy !== col) setSortDir('asc');
  }, [sortBy]);

  const totals  = data?.totals;
  const items   = data?.items ?? [];
  const total   = data?.total ?? 0;
  const globalRate = totals && totals.total_sent > 0
    ? Math.round((totals.total_completed / totals.total_sent) * 100) : 0;

  const SortHeader = useMemo(() => ({ col, label }: { col: SortCol; label: string }) => (
    <TableSortLabel
      active={sortBy === col}
      direction={sortBy === col ? sortDir : 'asc'}
      onClick={() => handleSort(col)}
      sx={{
        color: 'white !important',
        '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.5) !important' },
        '&.Mui-active .MuiTableSortLabel-icon': { color: '#c8102e !important' },
      }}
    >
      {label}
    </TableSortLabel>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [sortBy, sortDir, handleSort]);

  return (
    <PageWrapper maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a2332', fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Control Tower
          </Typography>
          {!isLoading && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
              {total.toLocaleString()} survey{total !== 1 ? 's' : ''}
              {isFetching && !isLoading && <CircularProgress size={10} sx={{ ml: 1 }} />}
            </Typography>
          )}
        </Box>
      </Box>

      {/* KPI Strip — global totals (not filtered) */}
      <Box sx={{
        bgcolor: '#1a2332', color: 'white', borderRadius: 2,
        display: 'flex', p: { xs: 2, md: 3 }, gap: { xs: 3, md: 5 },
        mb: 3, flexWrap: 'wrap',
      }}>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Box key={i}><Skeleton variant="text" width={60} sx={{ bgcolor: 'rgba(255,255,255,.2)' }} /><Skeleton variant="text" width={80} sx={{ bgcolor: 'rgba(255,255,255,.1)' }} /></Box>
          ))
        ) : [
          { label: 'Projects',    value: (totals?.total_projects ?? 0).toLocaleString() },
          { label: 'Surveys',     value: (totals?.total_surveys  ?? 0).toLocaleString() },
          { label: 'Links Sent',  value: (totals?.total_sent     ?? 0).toLocaleString() },
          { label: 'Completed',   value: (totals?.total_completed ?? 0).toLocaleString() },
          { label: 'Global Rate', value: `${globalRate}%` },
        ].map(({ label, value }) => (
          <Box key={label} sx={{ minWidth: { xs: 80, md: 'auto' } }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#c8102e', fontSize: { xs: '1.5rem', md: '2.125rem' } }}>{value}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Filters row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search project or survey type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: '1 1 240px', maxWidth: 360 }}
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
        <Select size="small" value={surveyStatus} onChange={(e) => setSurveyStatus(e.target.value)} displayEmpty sx={{ minWidth: 130 }}>
          <MenuItem value="">All statuses</MenuItem>
          {SURVEY_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
        <Select size="small" value={langCode} onChange={(e) => setLangCode(e.target.value)} displayEmpty sx={{ minWidth: 110 }}>
          <MenuItem value="">All langs</MenuItem>
          {LANGUAGES.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
        </Select>
        {(search || surveyStatus || langCode) && (
          <Button size="small" variant="outlined" sx={{ textTransform: 'none' }}
            onClick={() => { setSearch(''); setSurveyStatus(''); setLangCode(''); }}>
            Clear
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Chip label={`Page ${page + 1} / ${data?.pages ?? '—'}`} size="small" variant="outlined" sx={{ display: { xs: 'none', sm: 'flex' } }} />
      </Box>

      {isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load control tower data.</Alert>}

      {/* Table */}
      <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <TableContainer component={Paper} elevation={2}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead sx={{ bgcolor: '#1a2332' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 600, width: 36 }}>#</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}><SortHeader col="project_code" label="Project" /></TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}><SortHeader col="project_name" label="Client" /></TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Manager</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}><SortHeader col="survey_type"   label="Type" /></TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Lang</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}><SortHeader col="survey_status" label="Status" /></TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Planned</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, minWidth: 130 }}><SortHeader col="sent_count"    label="Completion" /></TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}><SortHeader col="last_response" label="Last Response" /></TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Results</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 11 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" width="80%" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {search || surveyStatus || langCode ? 'No surveys match the current filters.' : 'No surveys found.'}
                  </TableCell>
                </TableRow>
              ) : items.map((row, i) => {
                const rate = row.sent_count > 0 ? Math.round((row.done_count / row.sent_count) * 100) : 0;
                return (
                  <TableRow key={row.survey_id} hover sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{(page * pageSize) + i + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{row.project_code}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.project_name}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.manager_name}</TableCell>
                    <TableCell>{row.survey_type}</TableCell>
                    <TableCell>{row.language_code}</TableCell>
                    <TableCell><StatusBadge status={row.survey_status} /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {row.planned_send_date ? new Date(row.planned_send_date).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={rate}
                          sx={{ flexGrow: 1, height: 6, borderRadius: 3 }} />
                        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
                          {row.done_count}/{row.sent_count}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {row.last_response ? new Date(row.last_response).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined"
                        sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                        onClick={() => navigate(`/surveys/${row.survey_id}/results`)}>
                        View →
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            rowsPerPageOptions={PAGE_SIZES}
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
