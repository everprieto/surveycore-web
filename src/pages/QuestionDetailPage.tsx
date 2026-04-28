import { useState } from 'react';
import {
  Typography, Paper, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, TextField,
  MenuItem, CircularProgress, Alert, Snackbar, Grid,
  IconButton, Tooltip,
} from '@mui/material';
import { DeleteOutlined as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { questionsApi } from '../api/questions';
import { StatusBadge } from '../components/StatusBadge';
import { PageWrapper } from '../components/PageWrapper';
import { usePermission } from '../hooks/usePermission';

const LANGUAGES = ['EN', 'ES', 'DEU', 'FR', 'PT'];

export function QuestionDetailPage() {
  const navigate = useNavigate();
  const { questionId } = useParams<{ questionId: string }>();
  const id = Number(questionId);
  const qc = useQueryClient();
  const canEdit = usePermission('survey.edit');

  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [translationForm, setTranslationForm] = useState({ language_code: 'ES', question_text: '' });

  const { data: question, isLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => questionsApi.getById(id),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['question', id] });

  const publishMutation = useMutation({
    mutationFn: () => questionsApi.publish(id),
    onSuccess: () => { invalidate(); setToast('Question published!'); },
    onError: () => setError('Failed to publish question'),
  });

  const deleteTranslation = useMutation({
    mutationFn: (translationId: number) => questionsApi.deleteTranslation(id, translationId),
    onSuccess: () => { invalidate(); setToast('Translation removed'); },
    onError: () => setError('Failed to remove translation'),
  });

  const addTranslation = useMutation({
    mutationFn: () => questionsApi.addTranslation(id, translationForm),
    onSuccess: () => {
      invalidate();
      // Reset to the next available language after saving
      setTranslationForm({ language_code: availableLanguages[1] ?? '', question_text: '' });
      setToast('Translation added');
    },
    onError: () => setError('Failed to add translation'),
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      </PageWrapper>
    );
  }

  if (!question) return null;

  const isDraft = question.status === 'DRAFT';

  // Languages that already have a translation — used to prevent duplicates
  const usedLanguages = new Set(question.translations.map((t) => t.language_code));
  const availableLanguages = LANGUAGES.filter((l) => !usedLanguages.has(l));
  const allLanguagesCovered = availableLanguages.length === 0;

  return (
    <PageWrapper>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">Question Library</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a2332' }}>
            {question.logical_code}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <StatusBadge status={question.status} />
            <StatusBadge status={question.answer_type} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isDraft && canEdit && (
            <>
              <Button
                variant="outlined"
                sx={{ textTransform: 'none' }}
                onClick={() => navigate(`/questions/${id}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                sx={{ bgcolor: '#c8102e', textTransform: 'none' }}
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
              >
                Publish
              </Button>
            </>
          )}
          <Button variant="outlined" sx={{ textTransform: 'none' }} onClick={() => navigate('/questions')}>
            ← Back
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Translations */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2}>
            <Box sx={{ p: 2, bgcolor: '#1a2332', borderRadius: '4px 4px 0 0' }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                Translations
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Language</TableCell>
                    <TableCell>Question Text</TableCell>
                    <TableCell>Default</TableCell>
                    {isDraft && canEdit && <TableCell />}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {question.translations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isDraft && canEdit ? 4 : 3} align="center" sx={{ color: 'text.secondary', py: 2 }}>
                        No translations
                      </TableCell>
                    </TableRow>
                  )}
                  {question.translations.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{t.language_code}</TableCell>
                      <TableCell>{t.question_text}</TableCell>
                      <TableCell>{t.is_default_language ? '✓' : ''}</TableCell>
                      {isDraft && canEdit && (
                        <TableCell align="right" sx={{ pr: 1 }}>
                          {!t.is_default_language && (
                            <Tooltip title="Remove translation">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteTranslation.mutate(t.id)}
                                disabled={deleteTranslation.isPending}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {isDraft && canEdit && (
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Add Translation</Typography>

                {allLanguagesCovered ? (
                  <Alert severity="success" sx={{ fontSize: '0.82rem' }}>
                    All available languages already have a translation.
                  </Alert>
                ) : (
                  <>
                    <TextField
                      select
                      label="Language"
                      size="small"
                      fullWidth
                      sx={{ mb: 1 }}
                      value={translationForm.language_code}
                      onChange={(e) => setTranslationForm((prev) => ({ ...prev, language_code: e.target.value }))}
                    >
                      {availableLanguages.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                    </TextField>
                    <TextField
                      label="Question Text"
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      sx={{ mb: 1 }}
                      value={translationForm.question_text}
                      onChange={(e) => setTranslationForm((prev) => ({ ...prev, question_text: e.target.value }))}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ bgcolor: '#1a2332', textTransform: 'none' }}
                      onClick={() => addTranslation.mutate()}
                      disabled={!translationForm.question_text || addTranslation.isPending}
                    >
                      Add Translation
                    </Button>
                  </>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Options */}
        {question.options.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={2}>
              <Box sx={{ p: 2, bgcolor: '#1a2332', borderRadius: '4px 4px 0 0' }}>
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                  Options
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Option Text</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {question.options.map((o, i) => (
                      <TableRow key={o.id} hover>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{o.option_text}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </PageWrapper>
  );
}
