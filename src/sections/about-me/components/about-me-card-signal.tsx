'use client';

import type { SignalPattern, SignalPatternsResult } from '../actions/about-me-signal-patterns';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

function PatternSection({ title, patterns, color }: { title: string; patterns: SignalPattern[]; color: 'error' | 'success' }) {
  if (patterns.length === 0) return null;

  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, color: `${color}.main`, mb: 0.5, display: 'block' }}>
        {title}
      </Typography>
      <Stack gap={0.75}>
        {patterns.map((p, i) => (
          <Box key={i} sx={{ px: 1.25, py: 0.875, bgcolor: 'background.neutral', borderRadius: 1 }}>
            <Stack direction="row" flexWrap="wrap" gap={0.5} alignItems="center">
              <Chip label={p.trigger} size="small" sx={{ fontSize: 11, height: 22 }} />
              <Chip label={p.emotion} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
            </Stack>
            {p.freq > 1 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.375, display: 'block' }} className="tabular">
                xuất hiện {p.freq} lần
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

type Props = { patterns: SignalPatternsResult };

export function AboutMeCardSignalBody({ patterns }: Props) {
  const hasData = patterns.negative.length > 0 || patterns.positive.length > 0;
  if (!hasData) return null;

  return (
    <Stack gap={1.25}>
      <PatternSection title="Tiêu cực" patterns={patterns.negative} color="error" />
      <PatternSection title="Tích cực" patterns={patterns.positive} color="success" />
    </Stack>
  );
}
