'use client';

import type { AboutMeRow, SignalMetadata } from '../types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { SIGNAL_KIND_LABELS } from '../constants/about-me-copy';

// ----------------------------------------------------------------------

type Props = { row: AboutMeRow; onClick: () => void };

export function AboutMeRowSignal({ row, onClick }: Props) {
  const meta = row.metadata as Partial<SignalMetadata> | null;
  const kind = meta?.kind ?? 'positive';
  const isNeg = kind === 'negative';

  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      aria-label={`Xem chi tiết tín hiệu: ${row.title}`}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        // Coloured left border instead of full-bg colour — cleaner, less noisy.
        border: '1px solid',
        borderColor: 'divider',
        borderLeftWidth: 3,
        borderLeftColor: isNeg ? 'error.main' : 'success.main',
        boxShadow: '0 1px 2px 0 rgba(145, 158, 171, 0.08)',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 16px -4px rgba(145, 158, 171, 0.16)',
        },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
        <Stack direction="row" alignItems="flex-start" gap={1} sx={{ flex: 1, minWidth: 0 }}>
          <Iconify
            icon={isNeg ? 'solar:danger-triangle-bold' : 'solar:check-circle-bold'}
            width={18}
            sx={{ color: isNeg ? 'error.main' : 'success.main', flexShrink: 0, mt: 0.25 }}
            aria-label={SIGNAL_KIND_LABELS[kind]}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4,
              }}
            >
              {row.title}
            </Typography>
            {meta?.trigger && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Trigger: {meta.trigger}
              </Typography>
            )}
            {meta?.emotion && (
              <Chip
                label={meta.emotion}
                size="small"
                sx={{ mt: 0.5, height: 18, fontSize: 10, bgcolor: isNeg ? 'error.light' : 'success.light', color: 'common.white' }}
              />
            )}
          </Box>
        </Stack>
        <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, pt: 0.25 }} className="tabular">
          {fDate(row.updatedAt)}
        </Typography>
      </Stack>
    </Box>
  );
}
