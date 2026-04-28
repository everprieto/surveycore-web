import { useState } from 'react';
import {
  Typography, Box, Paper, Button, TextField, MenuItem,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
  Checkbox, FormGroup, CircularProgress, Alert, Container,
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { publicApi } from '../api/public';
import type { QuestionForSurvey } from '../types';

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: QuestionForSurvey;
  value: string | string[];
  onChange: (v: string | string[]) => void;
}) {
  const { answer_type, options } = question;

  if (answer_type === 'RATING') {
    return (
      <FormControl component="fieldset">
        <FormLabel component="legend" sx={{ mb: 1 }}>Rate 1–5</FormLabel>
        <RadioGroup row value={value} onChange={(e) => onChange(e.target.value)}>
          {[
            { v: '1', label: 'Very Poor' },
            { v: '2', label: 'Poor' },
            { v: '3', label: 'Neutral' },
            { v: '4', label: 'Good' },
            { v: '5', label: 'Excellent' },
          ].map(({ v, label }) => (
            <FormControlLabel key={v} value={v} control={<Radio />} label={`${v} – ${label}`} />
          ))}
        </RadioGroup>
      </FormControl>
    );
  }

  if (answer_type === 'YES_NO') {
    return (
      <FormControl component="fieldset">
        <RadioGroup row value={value} onChange={(e) => onChange(e.target.value)}>
          <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
          <FormControlLabel value="No" control={<Radio />} label="No" />
        </RadioGroup>
      </FormControl>
    );
  }

  if (answer_type === 'TEXT') {
    return (
      <TextField
        multiline
        rows={3}
        fullWidth
        placeholder="Your answer..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (answer_type === 'DROPDOWN') {
    return (
      <TextField
        select
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label="Select an option"
      >
        {options.map((o) => (
          <MenuItem key={o.id} value={o.text}>{o.text}</MenuItem>
        ))}
      </TextField>
    );
  }

  if (answer_type === 'MULTI_SELECT') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <FormGroup>
        {options.map((o) => (
          <FormControlLabel
            key={o.id}
            control={
              <Checkbox
                checked={selected.includes(o.text)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, o.text]
                    : selected.filter((v) => v !== o.text);
                  onChange(next);
                }}
              />
            }
            label={o.text}
          />
        ))}
      </FormGroup>
    );
  }

  return null;
}

export function TakeSurveyPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [submitError, setSubmitError] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['take-survey', token],
    queryFn: () => publicApi.getTakeSurvey(token!),
    enabled: !!token,
  });

  const submit = useMutation({
    mutationFn: () => {
      const payload = {
        answers: (data?.questions ?? []).map((q) => {
          const val = answers[q.sq_id] ?? '';
          if (q.answer_type === 'RATING') {
            return { sq_id: q.sq_id, score: Number(val) };
          }
          const answer = Array.isArray(val) ? val.join(', ') : val;
          return { sq_id: q.sq_id, answer_value: answer };
        }),
      };
      return publicApi.submitSurvey(token!, payload);
    },
    onSuccess: () => navigate(`/survey/${token}/thanks`),
    onError: () => setSubmitError('Failed to submit. Please try again.'),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error">Survey not found or access link is invalid.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 6 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="overline" sx={{ color: '#c8102e', letterSpacing: 3 }}>
            Client Satisfaction Survey
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a2332', mt: 1 }}>
            We value your feedback
          </Typography>
          <Box sx={{ width: 60, height: 4, bgcolor: '#c8102e', mx: 'auto', mt: 2 }} />
        </Box>

        {submitError && <Alert severity="error" sx={{ mb: 3 }}>{submitError}</Alert>}

        <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}>
          {data.questions.map((q, i) => (
            <Paper key={q.sq_id} elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#1a2332' }}>
                {i + 1}. {q.question_text}
              </Typography>
              <QuestionField
                question={q}
                value={answers[q.sq_id] ?? (q.answer_type === 'MULTI_SELECT' ? [] : '')}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [q.sq_id]: v }))}
              />
            </Paper>
          ))}

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submit.isPending}
              sx={{ bgcolor: '#c8102e', px: 6, textTransform: 'none', fontSize: '1rem' }}
            >
              {submit.isPending ? 'Submitting...' : 'Submit Survey'}
            </Button>
          </Box>
        </form>

        <Typography variant="caption" sx={{ mt: 4, color: 'text.secondary', display: 'block', textAlign: 'center' }}>
          Your responses are confidential and will only be used to improve our services.
        </Typography>
      </Container>
    </Box>
  );
}
