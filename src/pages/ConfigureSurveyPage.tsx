import { useState } from 'react';
import {
  Typography, Paper, Box, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, TextField,
  CircularProgress, Tooltip, IconButton, Switch, Alert,
} from '@mui/material';
import { Preview as PreviewIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { surveysApi } from '../api/surveys';
import { questionsApi } from '../api/questions';
import { StatusBadge } from '../components/StatusBadge';
import { PageWrapper } from '../components/PageWrapper';
import { SurveyPreviewDialog } from '../components/SurveyPreviewDialog';
import { usePermission } from '../hooks/usePermission';
import type { RecipientCreate } from '../types';

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function ConfigureSurveyPage() {
  const navigate = useNavigate();
  const { surveyId } = useParams<{ surveyId: string }>();
  const id = Number(surveyId);
  const qc = useQueryClient();
  const canEdit = usePermission('survey.edit');
  const canSend = usePermission('survey.send');

  const [toast, setToast] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');
  const [previewOpen, setPreviewOpen] = useState(false);

  const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setToast(message);
    setToastSeverity(severity);
  };
  const [recipient, setRecipient] = useState<RecipientCreate>({
    recipient_name: '', recipient_email: '', company: '', role: '',
  });

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['survey-config', id],
    queryFn: () => surveysApi.getConfig(id),
  });

  const { data: allQuestions } = useQuery({
    queryKey: ['questions'],
    queryFn: questionsApi.getAll,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['survey-config', id] });

  const addQuestion = useMutation({
    mutationFn: (qid: number) => surveysApi.addQuestion(id, qid),
    onSuccess: () => { invalidate(); showToast('Question added'); },
    onError: (error: any) => showToast(`Error: ${error.response?.data?.detail || (error as Error).message}`, 'error'),
  });

  const removeQuestion = useMutation({
    mutationFn: (sqId: number) => surveysApi.removeQuestion(id, sqId),
    onSuccess: () => { invalidate(); showToast('Question removed'); },
    onError: (error: any) => showToast(`Error: ${error.response?.data?.detail || (error as Error).message}`, 'error'),
  });

  const updateQuestion = useMutation({
    mutationFn: ({ sqId, isRequired }: { sqId: number; isRequired: boolean }) =>
      surveysApi.updateQuestion(id, sqId, { is_required: isRequired }),
    onSuccess: () => { invalidate(); },
    onError: (error: any) => showToast(`Error: ${error.response?.data?.detail || (error as Error).message}`, 'error'),
  });

  const addRecipient = useMutation({
    mutationFn: (data: RecipientCreate) => surveysApi.addRecipient(id, data),
    onSuccess: () => {
      invalidate();
      setRecipient({ recipient_name: '', recipient_email: '', company: '', role: '' });
      showToast('Recipient added');
    },
    onError: (error: any) => showToast(`Error: ${error.response?.data?.detail || (error as Error).message}`, 'error'),
  });

  const removeRecipient = useMutation({
    mutationFn: (rid: number) => surveysApi.removeRecipient(id, rid),
    onSuccess: () => { invalidate(); showToast('Recipient removed'); },
    onError: (error: any) => showToast(`Error: ${error.response?.data?.detail || (error as Error).message}`, 'error'),
  });

  const generateLinks = useMutation({
    mutationFn: () => surveysApi.generateLinks(id),
    onSuccess: () => { invalidate(); showToast('Access links generated!'); },
    onError: (error: any) => showToast(`Error: ${error.response?.data?.detail || (error as Error).message}`, 'error'),
  });

  const sendEmails = useMutation({
    mutationFn: () => surveysApi.sendEmails(id),
    onSuccess: (result) => {
      if (result.success_count > 0 && config) {
        qc.setQueryData(['survey-config', id], {
          ...config,
          survey: { ...config.survey, survey_status: 'SENT' },
        });
      }
      invalidate();
      const message = `Emails sent: ${result.success_count} succeeded, ${result.failed_count} failed`;
      showToast(message, result.failed_count > 0 ? 'error' : 'success');
    },
    onError: (error: any) => showToast(`Error: ${error.response?.data?.detail || (error as Error).message}`, 'error'),
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      </PageWrapper>
    );
  }

  if (error || !config) {
    return (
      <PageWrapper>
        <Typography color="error" sx={{ mt: 4 }}>
          Error loading survey configuration. Make sure the backend is running and you have access to this survey.
          {error && ` (${(error as Error).message})`}
        </Typography>
      </PageWrapper>
    );
  }

  const selectedQIds = new Set(config.questions.map((q) => q.master_question_id));
  const availableQuestions = (allQuestions ?? []).filter(
    (q) => q.status === 'PUBLISHED' && !selectedQIds.has(q.id) && q.survey_type_id === config.survey.survey_type_id,
  );

  const surveyUrl = (token: string) =>
    `${window.location.origin}/survey/${token}`;

  const isSurveyLocked = config.survey.survey_status === 'SENT';

  return (
    <PageWrapper maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Survey #{id} · {config.survey.language_code}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a2332' }}>
              Configure Survey — {config.survey.survey_type || 'Unknown'}
            </Typography>
            <StatusBadge status={config.survey.survey_status} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            sx={{ textTransform: 'none' }}
            onClick={() => setPreviewOpen(true)}
            disabled={config.questions.length === 0}
          >
            Preview
          </Button>
          <Button
            variant="outlined"
            sx={{ textTransform: 'none' }}
            onClick={() => navigate(config.survey.project_id ? `/projects/${config.survey.project_id}/surveys` : '/surveys/consult')}
          >
            ← All Surveys
          </Button>
          <Button
            variant="outlined"
            sx={{ textTransform: 'none' }}
            onClick={() => navigate(`/surveys/${id}/results`)}
          >
            View Results →
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT COLUMN: Questions */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Available questions */}
          <Paper elevation={2} sx={{ mb: 3 }}>
            <Box sx={{ p: 2, bgcolor: '#1a2332', borderRadius: '4px 4px 0 0' }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                Available Published Questions
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Add</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableQuestions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 2 }}>
                        {allQuestions && allQuestions.filter((q) => q.survey_type_id === config.survey.survey_type_id && q.status === 'PUBLISHED').length === 0
                          ? 'No published questions available for this survey type'
                          : 'All published questions of this type are added'}
                      </TableCell>
                    </TableRow>
                  )}
                  {availableQuestions.map((q) => (
                    <TableRow key={q.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{q.logical_code}</TableCell>
                      <TableCell>{q.answer_type}</TableCell>
                      <TableCell align="center">
                        {canEdit && (
                          <Button
                            size="small"
                            variant="contained"
                            sx={{ bgcolor: '#1a2332', minWidth: 0, px: 1.5, textTransform: 'none' }}
                            onClick={() => addQuestion.mutate(q.id)}
                            disabled={isSurveyLocked}
                          >
                            +
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Selected questions */}
          <Paper elevation={2}>
            <Box sx={{ p: 2, bgcolor: '#c8102e', borderRadius: '4px 4px 0 0' }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                Selected Questions ({config.questions.length})
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Required</TableCell>
                    <TableCell align="center">Remove</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {config.questions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 2 }}>
                        No questions selected yet
                      </TableCell>
                    </TableRow>
                  )}
                  {config.questions.map((sq) => {
                    const q = allQuestions?.find((x) => x.id === sq.master_question_id);
                    return (
                      <TableRow key={sq.id} hover>
                        <TableCell>{sq.display_order}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{q?.logical_code ?? sq.master_question_id}</TableCell>
                        <TableCell>{q?.answer_type ?? '—'}</TableCell>
                        <TableCell align="center">
                          {canEdit ? (
                            <Switch
                              size="small"
                              checked={sq.is_required}
                              onChange={(e) => updateQuestion.mutate({ sqId: sq.id, isRequired: e.target.checked })}
                              disabled={updateQuestion.isPending}
                            />
                          ) : (
                            <Typography variant="body2">{sq.is_required ? '✓' : '—'}</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {canEdit && (
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ minWidth: 0, px: 1.5, textTransform: 'none' }}
                              onClick={() => removeQuestion.mutate(sq.id)}
                              disabled={isSurveyLocked}
                            >
                              ×
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: Recipients & Links */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Recipients table */}
          <Paper elevation={2} sx={{ mb: 3 }}>
            <Box sx={{ p: 2, bgcolor: '#1a2332', borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                Recipients ({config.recipients.length})
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 220 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="center">Del</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {config.recipients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 2 }}>
                        No recipients yet
                      </TableCell>
                    </TableRow>
                  )}
                  {config.recipients.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.recipient_name}</TableCell>
                      <TableCell>{r.recipient_email}</TableCell>
                      <TableCell>{r.company}</TableCell>
                      <TableCell>{r.role}</TableCell>
                      <TableCell align="center">
                        {canEdit && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ minWidth: 0, px: 1.5, textTransform: 'none' }}
                            onClick={() => removeRecipient.mutate(r.id)}
                            disabled={isSurveyLocked}
                          >
                            ×
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Add recipient form — only for users with survey.edit */}
            {canEdit && !isSurveyLocked && (<Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Add Recipient
              </Typography>
              <Grid container spacing={1}>
                {[
                  { label: 'Name', key: 'recipient_name' },
                  { label: 'Email', key: 'recipient_email' },
                  { label: 'Company', key: 'company' },
                  { label: 'Role', key: 'role' },
                ].map(({ label, key }) => {
                  const isEmailField = key === 'recipient_email';
                  const emailError = isEmailField && recipient.recipient_email && !isValidEmail(recipient.recipient_email);
                  const emailExists = isEmailField && recipient.recipient_email && config.recipients.some((r) => r.recipient_email.toLowerCase() === recipient.recipient_email.toLowerCase());
                  return (
                    <Grid key={key} size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label={label}
                        size="small"
                        fullWidth
                        value={recipient[key as keyof RecipientCreate]}
                        onChange={(e) => setRecipient((prev) => ({ ...prev, [key]: e.target.value }))}
                        error={!!emailError || !!emailExists}
                        helperText={emailError ? 'Invalid email address' : emailExists ? 'This email is already added' : ''}
                      />
                    </Grid>
                  );
                })}
              </Grid>
              <Button
                variant="contained"
                size="small"
                sx={{ mt: 1.5, bgcolor: '#1a2332', textTransform: 'none' }}
                onClick={() => addRecipient.mutate(recipient)}
                disabled={!recipient.recipient_name || !recipient.recipient_email || !isValidEmail(recipient.recipient_email) || config.recipients.some((r) => r.recipient_email.toLowerCase() === recipient.recipient_email.toLowerCase())}
              >
                Add Recipient
              </Button>
            </Box>)}
          </Paper>

          {/* Access links */}
          <Paper elevation={2}>
            <Box sx={{ p: 2, bgcolor: '#1a2332', borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                Access Links ({config.access_links.length})
              </Typography>
              {canSend && !isSurveyLocked && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    sx={{ bgcolor: '#c8102e', textTransform: 'none' }}
                    onClick={() => generateLinks.mutate()}
                    disabled={config.recipients.length === 0}
                  >
                    Generate Links
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    sx={{ bgcolor: '#0369a1', textTransform: 'none', position: 'relative' }}
                    onClick={() => sendEmails.mutate()}
                    disabled={config.access_links.length === 0 || sendEmails.isPending}
                  >
                    {sendEmails.isPending ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
                        Sending...
                      </>
                    ) : (
                      'Send Emails'
                    )}
                  </Button>
                </Box>
              )}
            </Box>
            {config.access_links.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                No links generated yet — add recipients and click "Generate Links"
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Recipient</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Opened</TableCell>
                      <TableCell>Completed</TableCell>
                      <TableCell>Link</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {config.access_links.map((link) => {
                      const r = config.recipients.find((x) => x.id === link.recipient_id);
                      const url = surveyUrl(link.access_token);
                      return (
                        <TableRow key={link.id} hover>
                          <TableCell>{r?.recipient_name ?? '—'}</TableCell>
                          <TableCell><StatusBadge status={link.status} /></TableCell>
                          <TableCell>
                            {link.opened_at ? new Date(link.opened_at).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            {link.completed_at ? new Date(link.completed_at).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={url}>
                              <IconButton
                                size="small"
                                onClick={() => { navigator.clipboard.writeText(url); setToast('Link copied!'); }}
                              >
                                📋
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {toast && (
        <Box sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          <Alert
            severity={toastSeverity}
            onClose={() => setToast('')}
            sx={{ minWidth: 300 }}
          >
            {toast}
          </Alert>
        </Box>
      )}

      <SurveyPreviewDialog
        surveyId={id}
        surveyType={config.survey.survey_type}
        language={config.survey.language_code}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </PageWrapper>
  );
}
