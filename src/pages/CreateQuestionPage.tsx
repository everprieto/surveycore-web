import { useState, useEffect, useRef } from 'react';
import {
  Typography, Paper, Box, TextField, MenuItem, Button, Alert,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { questionsApi } from '../api/questions';
import { PageWrapper } from '../components/PageWrapper';

const ANSWER_TYPES = ['RATING', 'YES_NO', 'TEXT', 'DROPDOWN', 'MULTI_SELECT'];
const OPTIONS_TYPES = ['DROPDOWN', 'MULTI_SELECT'];

export function CreateQuestionPage() {
  const navigate = useNavigate();
  const { questionId } = useParams<{ questionId: string }>();
  const isEdit = !!questionId;
  const id = questionId ? Number(questionId) : undefined;

  const { data: existing } = useQuery({
    queryKey: ['question', id],
    queryFn: () => questionsApi.getById(id!),
    enabled: isEdit,
  });

  const [logicalCode, setLogicalCode] = useState('');
  const [answerType, setAnswerType] = useState('RATING');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Track if form has been initialized to avoid cascading renders
  const initializedRef = useRef(false);

  useEffect(() => {
    if (existing && !initializedRef.current) {
      initializedRef.current = true;
      setLogicalCode(existing.logical_code);
      setAnswerType(existing.answer_type);
      const defaultTranslation = existing.translations.find((t) => t.is_default_language);
      setQuestionText(defaultTranslation?.question_text ?? '');
      setOptions(existing.options.map((o) => o.option_text).join(', '));
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const optionsList = OPTIONS_TYPES.includes(answerType)
        ? options.split(',').map((o) => o.trim()).filter(Boolean)
        : [];

      let result;
      if (isEdit && id) {
        result = await questionsApi.update(id, { logical_code: logicalCode, answer_type: answerType, question_text: questionText });
      } else {
        result = await questionsApi.create({
          logical_code: logicalCode,
          answer_type: answerType,
          question_text: questionText,
          options: optionsList,
        });
      }
      navigate(`/questions/${result.id}`);
    } catch {
      setError('Failed to save question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper maxWidth="sm">
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a2332', mb: 3 }}>
        {isEdit ? 'Edit Question' : 'Create Question'}
      </Typography>

      <Paper elevation={2} sx={{ p: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Logical Code"
            fullWidth
            margin="normal"
            value={logicalCode}
            onChange={(e) => setLogicalCode(e.target.value)}
            required
            placeholder="e.g. Q_SATISFACTION_01"
          />

          <TextField
            select
            label="Answer Type"
            fullWidth
            margin="normal"
            value={answerType}
            onChange={(e) => setAnswerType(e.target.value)}
            required
          >
            {ANSWER_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>

          <TextField
            label={isEdit ? 'Question Text (default language)' : 'Question Text (English)'}
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            required
            placeholder="Enter the question text"
            helperText={isEdit ? 'Updates the default language translation.' : undefined}
          />

          {OPTIONS_TYPES.includes(answerType) && (
            <TextField
              label="Options (comma-separated)"
              fullWidth
              margin="normal"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder="Option A, Option B, Option C"
              helperText="Enter options separated by commas"
            />
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#c8102e', textTransform: 'none' }}
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Question'}
            </Button>
            <Button
              variant="outlined"
              sx={{ textTransform: 'none' }}
              onClick={() => navigate(isEdit ? `/questions/${id}` : '/questions')}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </PageWrapper>
  );
}
