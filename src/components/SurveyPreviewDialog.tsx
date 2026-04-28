import { useState } from 'react';
import {
  Dialog, DialogContent, DialogTitle, DialogActions,
  IconButton, Box, Typography, Paper, Button, CircularProgress,
  Alert, TextField, MenuItem, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, Checkbox, FormGroup, Chip, Divider,
} from '@mui/material';
import { Close as CloseIcon, Preview as PreviewIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { surveysApi } from '../api/surveys';
import type { QuestionForSurvey } from '../types';

// ── Question renderers (read-only preview, identical UX to TakeSurveyPage) ──

function PreviewField({ question }: { question: QuestionForSurvey }) {
  const [value, setValue] = useState<string | string[]>(
    question.answer_type === 'MULTI_SELECT' ? [] : ''
  );
  const { answer_type, options } = question;

  if (answer_type === 'RATING') {
    return (
      <FormControl component="fieldset">
        <FormLabel sx={{ mb: 1, fontSize: '0.85rem', color: 'text.secondary' }}>Rate 1–5</FormLabel>
        <RadioGroup row value={value} onChange={(e) => setValue(e.target.value)}>
          {[
            { v: '1', label: 'Very Poor' },
            { v: '2', label: 'Poor' },
            { v: '3', label: 'Neutral' },
            { v: '4', label: 'Good' },
            { v: '5', label: 'Excellent' },
          ].map(({ v, label }) => (
            <FormControlLabel key={v} value={v} control={<Radio size="small" />}
              label={<Typography variant="body2">{v} – {label}</Typography>} />
          ))}
        </RadioGroup>
      </FormControl>
    );
  }

  if (answer_type === 'YES_NO') {
    return (
      <FormControl component="fieldset">
        <RadioGroup row value={value} onChange={(e) => setValue(e.target.value)}>
          <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
          <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
        </RadioGroup>
      </FormControl>
    );
  }

  if (answer_type === 'TEXT') {
    return (
      <TextField multiline rows={3} fullWidth placeholder="Your answer…"
        value={value} onChange={(e) => setValue(e.target.value)} size="small" />
    );
  }

  if (answer_type === 'DROPDOWN') {
    return (
      <TextField select fullWidth label="Select an option" size="small"
        value={value} onChange={(e) => setValue(e.target.value)}>
        {options.map((o) => <MenuItem key={o.id} value={o.text}>{o.text}</MenuItem>)}
      </TextField>
    );
  }

  if (answer_type === 'MULTI_SELECT') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <FormGroup>
        {options.map((o) => (
          <FormControlLabel key={o.id}
            control={
              <Checkbox size="small"
                checked={selected.includes(o.text)}
                onChange={(e) => setValue(
                  e.target.checked ? [...selected, o.text] : selected.filter((v) => v !== o.text)
                )} />
            }
            label={<Typography variant="body2">{o.text}</Typography>}
          />
        ))}
      </FormGroup>
    );
  }

  return null;
}

// ── Dialog ────────────────────────────────────────────────────────────────────

interface Props {
  surveyId: number;
  surveyType?: string;
  language?: string;
  open: boolean;
  onClose: () => void;
}

export function SurveyPreviewDialog({ surveyId, surveyType, language, open, onClose }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['survey-preview', surveyId],
    queryFn: () => surveysApi.getPreview(surveyId),
    enabled: open,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      slotProps={{ paper: { sx: { maxHeight: '90vh' } } }}>

      {/* Header */}
      <DialogTitle sx={{ bgcolor: '#1a2332', color: 'white', pr: 6, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PreviewIcon sx={{ fontSize: 20, color: '#c8102e' }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Survey Preview
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {surveyType} · {language} · {data?.questions.length ?? '—'} questions
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"
          sx={{ position: 'absolute', right: 12, top: 12, color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Preview banner */}
      <Box sx={{ bgcolor: '#fef3c7', borderBottom: '1px solid #fbbf24', px: 3, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PreviewIcon sx={{ fontSize: 16, color: '#92400e' }} />
        <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600 }}>
          Preview mode — interactions are enabled for testing but no answers will be submitted.
        </Typography>
      </Box>

      <DialogContent sx={{ bgcolor: '#f5f5f5', p: { xs: 2, md: 4 } }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Alert severity="error">Failed to load preview. Please try again.</Alert>
        )}

        {data && (
          <>
            {/* Survey header (same style as TakeSurveyPage) */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="overline" sx={{ color: '#c8102e', letterSpacing: 3 }}>
                Client Satisfaction Survey
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mt: 1 }}>
                We value your feedback
              </Typography>
              <Box sx={{ width: 48, height: 3, bgcolor: '#c8102e', mx: 'auto', mt: 1.5 }} />
            </Box>

            {data.questions.length === 0 && (
              <Alert severity="info">No questions added to this survey yet.</Alert>
            )}

            {/* Questions */}
            {data.questions.map((q, i) => (
              <Paper key={q.sq_id} elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a2332', lineHeight: 1.3, flexGrow: 1 }}>
                    {i + 1}. {q.question_text}
                  </Typography>
                  <Chip
                    label={q.answer_type}
                    size="small"
                    sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600, fontSize: '0.65rem', flexShrink: 0 }}
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <PreviewField question={q} />
              </Paper>
            ))}

            {/* Mock submit */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button variant="contained" size="large" disabled
                sx={{ bgcolor: '#c8102e', px: 6, textTransform: 'none', fontSize: '1rem', '&.Mui-disabled': { bgcolor: '#e5b3bc', color: 'white' } }}>
                Submit Survey
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                Submit is disabled in preview mode
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none' }}>
          Close Preview
        </Button>
      </DialogActions>
    </Dialog>
  );
}
