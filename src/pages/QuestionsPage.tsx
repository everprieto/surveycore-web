import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Box, CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { questionsApi } from '../api/questions';
import { StatusBadge } from '../components/StatusBadge';
import { PageWrapper } from '../components/PageWrapper';
import type { Question } from '../types';

export function QuestionsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: questions, isLoading, error } = useQuery<Question[]>({
    queryKey: ['questions'],
    queryFn: questionsApi.getAll,
  });

  const publish = useMutation({
    mutationFn: (id: number) => questionsApi.publish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions'] }),
  });

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
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ bgcolor: '#1a2332' }}>
              <TableRow>
                {['Logical Code', 'Answer Type', 'Status', 'Translations', 'Options', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No questions yet — create your first one above
                  </TableCell>
                </TableRow>
              )}
              {questions.map((q) => (
                <TableRow key={q.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{q.logical_code}</TableCell>
                  <TableCell><StatusBadge status={q.answer_type} /></TableCell>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </PageWrapper>
  );
}
