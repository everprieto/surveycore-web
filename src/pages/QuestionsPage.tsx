import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Box, CircularProgress, TextField, MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { questionsApi } from '../api/questions';
import { surveysApi } from '../api/surveys';
import { StatusBadge } from '../components/StatusBadge';
import { PageWrapper } from '../components/PageWrapper';
import type { Question } from '../types';

export function QuestionsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [filterSurveyType, setFilterSurveyType] = useState<number | ''>('');
  const [filterAnswerType, setFilterAnswerType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const { data: questions, isLoading, error } = useQuery<Question[]>({
    queryKey: ['questions'],
    queryFn: questionsApi.getAll,
  });

  const { data: surveyTypes = [] } = useQuery({
    queryKey: ['survey-types'],
    queryFn: () => surveysApi.getSurveyTypes(),
  });

  const publish = useMutation({
    mutationFn: (id: number) => questionsApi.publish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions'] }),
  });

  const getUniqueAnswerTypes = () => {
    if (!questions) return [];
    return Array.from(new Set(questions.map((q) => q.answer_type))).sort();
  };

  const getUniqueStatuses = () => {
    if (!questions) return [];
    return Array.from(new Set(questions.map((q) => q.status))).sort();
  };

  const filteredQuestions = questions?.filter((q) => {
    if (filterSurveyType && q.survey_type_id !== filterSurveyType) return false;
    if (filterAnswerType && q.answer_type !== filterAnswerType) return false;
    if (filterStatus && q.status !== filterStatus) return false;
    return true;
  }) ?? [];

  return (
    <PageWrapper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a2332' }}>
          Question Library
        </Typography>
        <Button
          variant="contained"
          sx={{ bgcolor: '#c8102e', textTransform: 'none' }}
          onClick={() => navigate('/questions/create')}
        >
          + Create Question
        </Button>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Typography color="error">Error loading questions</Typography>}

      {questions && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <TextField
              select
              label="Survey Type"
              size="small"
              sx={{ minWidth: 150 }}
              value={filterSurveyType}
              onChange={(e) => setFilterSurveyType(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <MenuItem value="">All</MenuItem>
              {surveyTypes.map((st) => (
                <MenuItem key={st.id} value={st.id}>{st.survey_type}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Answer Type"
              size="small"
              sx={{ minWidth: 150 }}
              value={filterAnswerType}
              onChange={(e) => setFilterAnswerType(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {getUniqueAnswerTypes().map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              size="small"
              sx={{ minWidth: 150 }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {getUniqueStatuses().map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              sx={{ textTransform: 'none' }}
              onClick={() => {
                setFilterSurveyType('');
                setFilterAnswerType('');
                setFilterStatus('');
              }}
            >
              Reset Filters
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead sx={{ bgcolor: '#1a2332' }}>
                <TableRow>
                  {['Logical Code', 'Survey Type', 'Answer Type', 'Status', 'Translations', 'Options', 'Actions'].map((h) => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuestions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      {questions.length === 0 ? 'No questions yet — create your first one above' : 'No questions match the selected filters'}
                    </TableCell>
                  </TableRow>
                )}
                {filteredQuestions.map((q) => {
                const surveyType = surveyTypes.find((st) => st.id === q.survey_type_id);
                return (
                <TableRow key={q.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{q.logical_code}</TableCell>                  
                  <TableCell><StatusBadge status={q.answer_type} /></TableCell>
                  <TableCell>{surveyType?.survey_type ?? '—'}</TableCell>
                  <TableCell><StatusBadge status={q.status} /></TableCell>
                  <TableCell>{(q as Partial<{ translations: unknown[]; options: unknown[] }>).translations?.length ?? '—'}</TableCell>
                  <TableCell>{(q as Partial<{ translations: unknown[]; options: unknown[] }>).options?.length ?? '—'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'none' }}
                        onClick={() => navigate(`/questions/${q.id}`)}
                      >
                        Manage
                      </Button>
                      {q.status === 'DRAFT' && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ textTransform: 'none' }}
                            onClick={() => navigate(`/questions/${q.id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            sx={{ bgcolor: '#c8102e', textTransform: 'none' }}
                            onClick={() => publish.mutate(q.id)}
                            disabled={publish.isPending}
                          >
                            Publish
                          </Button>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        </>
      )}
    </PageWrapper>
  );
}
