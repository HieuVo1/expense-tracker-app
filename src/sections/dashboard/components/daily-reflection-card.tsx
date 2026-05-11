'use client';

import type { AboutMeRow } from 'src/sections/about-me/types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { Iconify } from 'src/components/iconify';

import { AboutMeDetailDialog } from 'src/sections/about-me/components/about-me-detail-dialog';
import {
  ABOUT_ME_TYPE_ICONS,
  ABOUT_ME_TYPE_LABELS,
  ABOUT_ME_TYPE_COLORS,
} from 'src/sections/about-me/constants/about-me-types';

// ----------------------------------------------------------------------

type Props = {
  reflection: AboutMeRow | null;
};

const MAX_PREVIEW_CHARS = 220;

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export function DailyReflectionCard({ reflection }: Props) {
  const [open, setOpen] = useState(false);

  if (!reflection) return null;

  const accent = ABOUT_ME_TYPE_COLORS[reflection.type];
  const typeLabel = ABOUT_ME_TYPE_LABELS[reflection.type];
  const icon = ABOUT_ME_TYPE_ICONS[reflection.type];

  return (
    <>
      <Card
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderLeft: 4,
          borderLeftColor: accent,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(accent, 0.18)} 0%, ${alpha(theme.palette.background.paper, 1)} 60%)`,
          transition: (theme) => theme.transitions.create(['transform', 'box-shadow']),
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: (theme) => theme.customShadows?.z12 ?? 6,
          },
        }}
      >
        <CardActionArea
          onClick={() => setOpen(true)}
          sx={{ p: { xs: 2, sm: 2.5 }, textAlign: 'left' }}
        >
          {/* Decorative quote glyph — large, faded, top-right corner */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 8,
              right: 12,
              fontSize: 56,
              lineHeight: 1,
              fontFamily: 'serif',
              color: (theme) => alpha(theme.palette.text.primary, 0.06),
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            “
          </Box>

          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: accent,
                flexShrink: 0,
              }}
            >
              <Iconify icon={icon} width={16} sx={{ color: 'text.primary' }} />
            </Box>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 10, letterSpacing: 0.6 }}
            >
              Hôm nay nhớ lại · {typeLabel}
            </Typography>
          </Stack>

          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 0.5, pr: { xs: 4, sm: 6 } }}
          >
            {reflection.title}
          </Typography>

          {reflection.content.trim().length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {truncate(reflection.content, MAX_PREVIEW_CHARS)}
            </Typography>
          )}
        </CardActionArea>
      </Card>

      <AboutMeDetailDialog open={open} row={reflection} onClose={() => setOpen(false)} />
    </>
  );
}
