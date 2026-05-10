'use client';

import type { AboutMeRow } from '../types';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

type Props = { rows: AboutMeRow[] };

export function AboutMeCardPrincipleBody({ rows }: Props) {
  if (rows.length === 0) return null;

  return (
    <>
      {rows.map((row) => (
        <Box
          key={row.id}
          sx={{
            display: 'flex',
            gap: 1.25,
            alignItems: 'flex-start',
            px: 1.25,
            py: 1,
            bgcolor: 'background.neutral',
            borderRadius: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 38, pt: 0.125 }}
            className="tabular"
          >
            {fDate(row.createdAt, 'DD/MM')}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: 13,
              lineHeight: 1.4,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {row.title}
          </Typography>
        </Box>
      ))}
    </>
  );
}
