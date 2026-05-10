'use client';

import type { AboutMeRow , LessonMetadata } from '../types';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { SOURCE_LABELS } from '../constants/about-me-copy';

// ----------------------------------------------------------------------

type Props = { rows: AboutMeRow[] };

export function AboutMeCardLessonBody({ rows }: Props) {
  if (rows.length === 0) return null;

  return (
    <>
      {rows.map((row) => {
        const meta = row.metadata as Partial<LessonMetadata> | null;
        const source = meta?.source;

        return (
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
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
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
              {source && (
                <Box
                  component="span"
                  sx={{
                    fontSize: 10,
                    fontWeight: 600,
                    px: 0.75,
                    py: 0.125,
                    borderRadius: 0.5,
                    bgcolor: 'primary.lighter',
                    color: 'primary.dark',
                    display: 'inline-block',
                    mt: 0.5,
                    lineHeight: 1.8,
                  }}
                >
                  {SOURCE_LABELS[source]}
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </>
  );
}
