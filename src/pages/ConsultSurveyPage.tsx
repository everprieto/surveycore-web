import { useQuery } from '@tanstack/react-query';
import {
  Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Box, CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { surveysApi } from '../api/surveys';
import { StatusBadge } from '../components/StatusBadge';
import { PageWrapper } from '../components/PageWrapper';
import { usePermission } from '../hooks/usePermission';

export function ConsultSurveyPage() {
  const navigate = useNavigate();
  const canResults = usePermission('results.view');

  const { data: surveys, isLoading } = useQuery({
    queryKey: ['user-surveys'],
    queryFn: () => surveysApi.getUserSurveys(),
  });

  return (
    <PageWrapper>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--color-navy)' }}>
          Consult Surveys
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {surveys && (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ bgcolor: 'var(--color-navy)' }}>
              <TableRow>
                {['#', 'Project', 'Type', 'Language', 'Status', 'Planned Send', 'Responses', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {surveys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No surveys created yet
                  </TableCell>
                </TableRow>
              )}
              {surveys.map((s, i) => (
                <TableRow key={s.survey_id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{s.project_name || '—'}</TableCell>
                  <TableCell>{s.survey_type}</TableCell>
                  <TableCell>{s.language_code}</TableCell>
                  <TableCell><StatusBadge status={s.survey_status} /></TableCell>
                  <TableCell>
                    {s.planned_send_date ? new Date(s.planned_send_date).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>{s.total_completed} / {s.total_sent}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        sx={{ bgcolor: 'var(--color-navy)', textTransform: 'none' }}
                        onClick={() => navigate(`/surveys/${s.survey_id}/configure`)}
                      >
                        Configure
                      </Button>
                      {canResults && (
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'none' }}
                          onClick={() => navigate(`/surveys/${s.survey_id}/results`)}
                        >
                          Results
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </PageWrapper>
  );
}
