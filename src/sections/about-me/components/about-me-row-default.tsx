'use client';

import type { AboutMeRow } from '../types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

// Strip HTML tags and basic markdown markers so the excerpt reads as plain
// prose. Also collapses whitespace from multi-line content.
function toPreview(content: string): string {
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/[*_`~]+/g, '')
    .replace(/^#+\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*>\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type Props = {
  row: AboutMeRow;
  onClick: () => void;
};

export function AboutMeRowDefault({ row, onClick }: Props) {
  const preview = row.content ? toPreview(row.content) : '';

  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        boxShadow: '0 1px 2px 0 rgba(145, 158, 171, 0.08)',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 16px -4px rgba(145, 158, 171, 0.16)',
          borderColor: 'transparent',
        },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1.5}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              mb: preview ? 0.5 : 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
            }}
          >
            {row.title}
          </Typography>
          {preview && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
              }}
            >
              {preview}
            </Typography>
          )}
          {row.tags.length > 0 && (
            <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
              {row.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  size="small"
                  sx={{ height: 20, fontSize: 11, bgcolor: 'background.neutral' }}
                />
              ))}
            </Stack>
          )}
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flexShrink: 0, pt: 0.25, fontSize: 11 }}
          className="tabular"
        >
          {fDate(row.updatedAt)}
        </Typography>
      </Stack>
    </Box>
  );
}
