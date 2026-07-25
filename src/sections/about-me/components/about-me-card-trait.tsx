'use client';

import type { AboutMeRow, TraitMetadata } from '../types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type Props = { rows: AboutMeRow[] };

export function AboutMeCardTraitBody({ rows }: Props) {
  if (rows.length === 0) return null;

  return (
    <>
      {rows.map((row) => {
        const meta = row.metadata as Partial<TraitMetadata> | null;
        const isStrength = meta?.kind === 'strength';

        return (
          <Box
            key={row.id}
            sx={{
              display: 'flex',
              gap: 1.25,
              alignItems: 'center',
              px: 1.25,
              py: 1,
              bgcolor: 'background.neutral',
              borderRadius: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 700,
                color: isStrength ? 'success.main' : 'error.main',
                minWidth: 16,
                lineHeight: 1,
              }}
            >
              {isStrength ? '+' : '−'}
            </Typography>
            <Stack sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.title}
              </Typography>
              {meta?.context && (
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                  {meta.context}
                </Typography>
              )}
            </Stack>
          </Box>
        );
      })}
    </>
  );
}
