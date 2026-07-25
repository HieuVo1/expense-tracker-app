'use client';

import type { AboutMeRow, TraitMetadata } from '../types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = { row: AboutMeRow; onClick: () => void };

export function AboutMeRowTrait({ row, onClick }: Props) {
  const meta = row.metadata as Partial<TraitMetadata> | null;
  const kind = meta?.kind ?? 'strength';
  const isStrength = kind === 'strength';

  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      aria-label={`Xem chi tiết: ${row.title}`}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 2px 0 rgba(145, 158, 171, 0.08)',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 16px -4px rgba(145, 158, 171, 0.16)',
          borderColor: 'transparent',
        },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      <Stack direction="row" alignItems="flex-start" gap={1.25}>
        {/* + / − marker — color is never the sole signal (shape + text also differ) */}
        <Box
          component="span"
          aria-hidden="true"
          sx={{
            fontSize: 16,
            fontWeight: 700,
            color: isStrength ? 'success.main' : 'error.main',
            flexShrink: 0,
            lineHeight: 1.5,
            width: 20,
            textAlign: 'center',
          }}
        >
          {isStrength ? '+' : '−'}
        </Box>

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
          {meta?.context && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {meta.context}
            </Typography>
          )}
        </Box>

        <Iconify
          icon={isStrength ? 'solar:bolt-bold' : 'solar:danger-triangle-bold'}
          width={14}
          sx={{ color: isStrength ? 'success.light' : 'error.light', flexShrink: 0, mt: 0.25 }}
          aria-label={isStrength ? 'Điểm mạnh' : 'Điểm yếu'}
        />
      </Stack>
    </Box>
  );
}
