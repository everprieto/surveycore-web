import { useState } from 'react';
import {
  Typography, Paper, Box, TextField, MenuItem, Button, Alert,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import { surveysApi } from '../api/surveys';
import { PageWrapper } from '../components/PageWrapper';

const SURVEY_TYPES = ['Quarterly', 'Project Closure', 'Custom'];
const LANGUAGES = ['EN', 'ES', 'DEU', 'FR', 'PT'];

export function CreateSurveyPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id),
  });

  const [surveyType, setSurveyType] = useState('Quarterly');
  const [language, setLanguage] = useState('EN');
  const [plannedDate, setPlannedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const survey = await surveysApi.create({
        project_id: id,
        survey_type: surveyType,
        language_code: language,
        planned_send_date: plannedDate,
      });
      navigate(`/surveys/${survey.id}/configure`);
    } catch {
      setError('Failed to create survey. Please try again.');
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
        <form onSubmit={handleSubmit}>
          <TextField
            select
            label="Survey Type"
            fullWidth
            margin="normal"
            value={surveyType}
            onChange={(e) => setSurveyType(e.target.value)}
            required
          >
            {SURVEY_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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
              onClick={() => navigate(`/projects/${id}/surveys`)}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </PageWrapper>
  );
}
