import {
  Typography, Paper, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Chip,
} from '@mui/material';
import { Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { resultsApi } from '../api/results';
import { PageWrapper } from '../components/PageWrapper';
import type { AnswerResult } from '../types';

function AnswerCell({ result }: { result: AnswerResult }) {
  if (result.answer_type === 'RATING') {
    return <Typography variant="body2">{result.score ?? '—'} / 5</Typography>;
  }
  if (result.answer_type === 'YES_NO') {
    const yes = result.answer?.toLowerCase() === 'yes' || result.answer === 'true';
    return <Chip label={result.answer ?? '—'} color={yes ? 'success' : 'error'} size="small" />;
  }
  if (result.answer_type === 'TEXT') {
    return <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{result.answer ?? '—'}</Typography>;
  }
  return <Typography variant="body2">{result.answer ?? '—'}</Typography>;
}

export function SurveyResultsPage() {
  const navigate = useNavigate();
  const { surveyId } = useParams<{ surveyId: string }>();
  const id = Number(surveyId);

  const { data, isLoading } = useQuery({
    queryKey: ['survey-results', id],
    queryFn: () => resultsApi.getSurveyResults(id),
  });

  const responseRate = data
    ? data.total_sent > 0 ? Math.round((data.total_completed / data.total_sent) * 100) : 0
    : 0;

  return (
    <PageWrapper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a2332' }}>
          Survey Results
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" sx={{ textTransform: 'none' }} onClick={() => navigate(`/surveys/${id}/configure`)}>
            ← Configure
          </Button>
          <Button variant="outlined" sx={{ textTransform: 'none' }} onClick={() => navigate(-1)}>
            All Surveys
          </Button>
        </Box>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      )}

      {data && (
        <>
          {/* KPI Strip */}
          <Box
            sx={{
              bgcolor: '#1a2332', color: 'white', borderRadius: 2,
              display: 'flex', p: { xs: 2, md: 3 }, gap: { xs: 3, md: 6 }, mb: 4, flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Completed', value: data.total_completed },
              { label: 'Links Sent', value: data.total_sent },
              { label: 'Response Rate', value: `${responseRate}%` },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#c8102e' }}>
                  {value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Questions */}
          {data.questions.map((qr, i) => (
            <Paper key={qr.sq_id} elevation={2} sx={{ mb: 3 }}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Q{i + 1}: {qr.question_text}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={qr.answer_type} size="small" />
                  <Chip label={`${qr.response_count} responses`} size="small" color="primary" />
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Respondent</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Answer</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {qr.answers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 2 }}>
                          No responses yet
                        </TableCell>
                      </TableRow>
                    )}
                    {qr.answers.map((a, j) => (
                      <TableRow key={j} hover>
                        <TableCell>{a.respondent}</TableCell>
                        <TableCell>{a.company}</TableCell>
                        <TableCell><AnswerCell result={a} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}
        </>
      )}
    </PageWrapper>
  );
}
