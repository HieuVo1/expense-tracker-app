'use client';

import type { Theme, SxProps } from '@mui/material/styles';
import type { SignalPattern, SignalPatternsResult } from '../actions/about-me-signal-patterns';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

function PatternRow({ pattern }: { pattern: SignalPattern }) {
  const isNeg = pattern.kind === 'negative';
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.25,
        borderRadius: 1,
        bgcolor: isNeg ? 'error.lighter' : 'success.lighter',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Stack direction="row" alignItems="center" gap={0.75}>
          <Iconify
            icon={isNeg ? 'solar:danger-triangle-bold' : 'solar:check-circle-bold'}
            width={14}
            sx={{ color: isNeg ? 'error.main' : 'success.main', flexShrink: 0 }}
          />
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
            {pattern.emotion}
          </Typography>
        </Stack>
        <Chip
          label={`×${pattern.freq}`}
          size="small"
          sx={{
            fontSize: 11,
            fontWeight: 700,
            bgcolor: isNeg ? 'error.main' : 'success.main',
            color: 'common.white',
            height: 20,
          }}
        />
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ pl: 2.75 }}>
        Trigger: {pattern.trigger}
      </Typography>

      {pattern.meaning && (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 2.75, fontStyle: 'italic' }}>
          {pattern.meaning}
        </Typography>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

type Props = {
  patterns: SignalPatternsResult;
  sx?: SxProps<Theme>;
};

export function AboutMePatternBoard({ patterns, sx }: Props) {
  const hasNeg = patterns.negative.length > 0;
  const hasPos = patterns.positive.length > 0;

  if (!hasNeg && !hasPos) return null;

  return (
    <Card sx={{ p: 2.5, ...sx }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Pattern tháng này
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        {hasNeg && (
          <Box>
            <Typography
              variant="overline"
              sx={{ color: 'error.main', fontWeight: 700, fontSize: 10, display: 'block', mb: 1 }}
            >
              Tín hiệu tiêu cực
            </Typography>
            <Stack spacing={1}>
              {patterns.negative.map((p, i) => (
                <PatternRow key={`neg-${i}`} pattern={p} />
              ))}
            </Stack>
          </Box>
        )}

        {hasPos && (
          <Box>
            <Typography
              variant="overline"
              sx={{ color: 'success.main', fontWeight: 700, fontSize: 10, display: 'block', mb: 1 }}
            >
              Tín hiệu tích cực
            </Typography>
            <Stack spacing={1}>
              {patterns.positive.map((p, i) => (
                <PatternRow key={`pos-${i}`} pattern={p} />
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    </Card>
  );
}
