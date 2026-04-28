import { useQuery } from '@tanstack/react-query';
import {
  Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Box, CircularProgress,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import { surveysApi } from '../api/surveys';
import { StatusBadge } from '../components/StatusBadge';
import { PageWrapper } from '../components/PageWrapper';
import { usePermission } from '../hooks/usePermission';

export function SurveyListPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);
  const canCreate  = usePermission('survey.create');
  const canEdit    = usePermission('survey.edit');
  const canResults = usePermission('results.view');

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id),
  });

  const { data: surveys, isLoading } = useQuery({
    queryKey: ['project-surveys', id],
    queryFn: () => surveysApi.getProjectSurveys(id),
  });

  return (
    <PageWrapper>
      {project && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="overline" color="text.secondary">
            {project.project_code} · {project.client_name}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a2332' }}>
            {project.project_name} — Surveys
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button variant="outlined" sx={{ textTransform: 'none' }} onClick={() => navigate('/projects')}>
          ← Back to Projects
        </Button>
        {canCreate && (
          <Button
            variant="contained"
            sx={{ bgcolor: '#c8102e', textTransform: 'none' }}
            onClick={() => navigate(`/projects/${id}/surveys/create`)}
          >
            + Create Survey
          </Button>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {surveys && (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ bgcolor: '#1a2332' }}>
              <TableRow>
                {['#', 'Type', 'Language', 'Status', 'Planned Send', 'Responses', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {surveys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No surveys yet — create one above
                  </TableCell>
                </TableRow>
              )}
              {surveys.map((s, i) => (
                <TableRow key={s.survey_id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{s.survey_type}</TableCell>
                  <TableCell>{s.language_code}</TableCell>
                  <TableCell><StatusBadge status={s.survey_status} /></TableCell>
                  <TableCell>
                    {s.planned_send_date ? new Date(s.planned_send_date).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>{s.total_completed} / {s.total_sent}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {canEdit && (
                        <Button
                          size="small"
                          variant="contained"
                          sx={{ bgcolor: '#1a2332', textTransform: 'none' }}
                          onClick={() => navigate(`/surveys/${s.survey_id}/configure`)}
                        >
                          Configure
                        </Button>
                      )}
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
