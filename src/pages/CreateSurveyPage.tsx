import { useState } from 'react';
import {
  Typography, Paper, Box, TextField, MenuItem, Button, Alert, CircularProgress,
} from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import { surveysApi } from '../api/surveys';
import { PageWrapper } from '../components/PageWrapper';

const LANGUAGES = ['EN', 'ES', 'DEU', 'FR', 'PT'];

export function CreateSurveyPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();
  const [searchParams] = useSearchParams();

  const queryProjectId = searchParams.get('projectId');
  const id = projectId ? Number(projectId) : (queryProjectId ? Number(queryProjectId) : null);

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => id ? projectsApi.getById(id) : Promise.resolve(null),
    enabled: !!id,
  });

  const { data: surveyTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ['survey-types'],
    queryFn: () => surveysApi.getSurveyTypes(),
  });

  const isProjectLocked = !!queryProjectId;
  const [surveyTypeId, setSurveyTypeId] = useState<number>(0);
  const [language, setLanguage] = useState('EN');
  const [plannedDate, setPlannedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyTypeId) {
      setError('Please select a survey type');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const survey = await surveysApi.create({
        project_id: id || null,
        survey_type_id: surveyTypeId,
        language_code: language,
        planned_send_date: plannedDate,
      });
      navigate(`/surveys/${survey.id}/configure`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper maxWidth="sm">
      {project && (
        <Typography variant="overline" color="text.secondary">
          {project.project_code} · {project.client_name}
        </Typography>
      )}
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a2332', mb: 3 }}>
        Create Survey{project ? ` for ${project.project_name}` : ''}
      </Typography>

      <Paper elevation={2} sx={{ p: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {isLoadingTypes && <CircularProgress />}
        {!isLoadingTypes && (
        <form onSubmit={handleSubmit}>
 
          <TextField
            select
            label="Survey Type"
            fullWidth
            margin="normal"
            value={surveyTypeId}
            onChange={(e) => setSurveyTypeId(Number(e.target.value))}
            required
          >
            <MenuItem value={0} disabled>-- Select a type --</MenuItem>
            {surveyTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.survey_type}</MenuItem>)}
          </TextField>

          <TextField
            select
            label="Language"
            fullWidth
            margin="normal"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            required
          >
            {LANGUAGES.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </TextField>

          <TextField
            label="Planned Send Date"
            type="date"
            fullWidth
            margin="normal"
            value={plannedDate}
            onChange={(e) => setPlannedDate(e.target.value)}
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {isProjectLocked && project && (
            <TextField
              label="Project"
              fullWidth
              margin="normal"
              value={`${project.project_code} - ${project.project_name}`}
              disabled
            />
          )}
      


          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#c8102e', textTransform: 'none' }}
            >
              {loading ? 'Creating...' : 'Create & Configure'}
            </Button>
            <Button
              variant="outlined"
              sx={{ textTransform: 'none' }}
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </Box>
        </form>
        )}
      </Paper>
    </PageWrapper>
  );
}
