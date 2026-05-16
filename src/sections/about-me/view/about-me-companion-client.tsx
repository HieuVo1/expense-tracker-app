'use client';

import type { CompanionResponse } from '../actions/about-me-companion';

import { toast } from 'sonner';
import { useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { Iconify } from 'src/components/iconify';

import { getCompanionSuggestion } from '../actions/about-me-companion';
import { CompanionRelatedEntryCard } from '../components/companion-related-entry-card';

// ----------------------------------------------------------------------

const EXAMPLES = [
  'Mình buồn vì hôm nay bị sếp mắng trước cả phòng',
  'Mình thấy bế tắc, không biết có nên đổi việc không',
  'Dạo này mình hay lo lắng và mất ngủ',
];

const MIN_LEN = 5;

// ----------------------------------------------------------------------

export function AboutMeCompanionClient() {
  const [problem, setProblem] = useState('');
  const [result, setResult] = useState<CompanionResponse | null>(null);
  const [pending, startTransition] = useTransition();

  const canSubmit = problem.trim().length >= MIN_LEN && !pending;

  const submit = () => {
    if (!canSubmit) return;
    startTransition(async () => {
      try {
        const res = await getCompanionSuggestion(problem);
        setResult(res);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.';
        toast.error(msg);
        console.error(err);
      }
    });
  };

  return (
    <Stack gap={3}>
      <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          Hôm nay bạn đang gặp chuyện gì?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Mình sẽ lắng nghe và nhắc lại những điều chính bạn từng vượt qua.
        </Typography>

        <TextField
          fullWidth
          multiline
          minRows={4}
          maxRows={10}
          placeholder="Mình cảm thấy…"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          disabled={pending}
        />

        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1}
          sx={{ mt: 1.5 }}
          aria-hidden={pending || undefined}
        >
          {EXAMPLES.map((ex) => (
            <Box
              key={ex}
              component="button"
              type="button"
              onClick={() => setProblem(ex)}
              disabled={pending}
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 5,
                border: (t) => `1px solid ${t.palette.divider}`,
                bgcolor: 'transparent',
                color: 'text.secondary',
                fontSize: 13,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                '&:disabled': { cursor: 'default', opacity: 0.5 },
              }}
            >
              {ex}
            </Box>
          ))}
        </Stack>

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <LoadingButton
            variant="contained"
            loading={pending}
            disabled={!canSubmit}
            onClick={submit}
            startIcon={<Iconify icon="solar:heart-pulse-bold" />}
          >
            Tâm sự
          </LoadingButton>
        </Stack>
      </Card>

      {result && (
        <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
          {!result.hasCorpus && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Bạn chưa có ghi chép nào ở mục “Về tôi”. Gợi ý dưới đây dựa trên cảm xúc bạn vừa chia sẻ.
            </Alert>
          )}

          <Stack gap={2.5}>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.7 }}>
                {result.acknowledgment}
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {result.insight}
            </Typography>

            {result.relatedEntries.length > 0 && (
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Bạn từng ghi lại
                </Typography>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  {result.relatedEntries.map((entry) => (
                    <Grid key={entry.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <CompanionRelatedEntryCard entry={entry} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <Divider />

            <Stack direction="row" gap={1.5} alignItems="flex-start">
              <Iconify
                icon="solar:bolt-bold"
                width={22}
                sx={{ color: 'primary.main', mt: 0.25, flexShrink: 0 }}
              />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Một bước nhỏ cho bạn
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {result.suggestion}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
