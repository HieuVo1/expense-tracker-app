'use client';

import type { DailyVerseRow } from 'src/sections/bible/actions/bible-daily-verse';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { youVersionUrl } from 'src/lib/bible';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  verse: DailyVerseRow | null;
};

export function DailyVerseCard({ verse }: Props) {
  if (!verse) return null;

  const range =
    verse.startVerse === verse.endVerse
      ? `${verse.startVerse}`
      : `${verse.startVerse}-${verse.endVerse}`;
  const refLabel = `${verse.bookName} ${verse.chapter}:${range}`;
  const externalUrl = youVersionUrl({
    bookCode: verse.bookCode,
    chapter: verse.chapter,
    startVerse: verse.startVerse,
    endVerse: verse.endVerse,
    version: verse.version,
  });

  const accent = '#00A76F';

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderLeft: 4,
        borderLeftColor: accent,
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(accent, 0.18)} 0%, ${alpha(theme.palette.background.paper, 1)} 60%)`,
        p: { xs: 2, sm: 2.5 },
      }}
    >
      {/* Decorative quote glyph */}
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
          <Iconify icon="solar:book-bookmark-bold" width={16} sx={{ color: 'common.white' }} />
        </Box>
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 10, letterSpacing: 0.6 }}
        >
          Câu kinh hôm nay
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" gap={0.75} sx={{ mb: 0.75 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accent }}>
          {refLabel}
        </Typography>
        <Tooltip title="Mở trên bible.com">
          <Link
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'inline-flex', color: 'text.secondary', '&:hover': { color: accent } }}
          >
            <Iconify icon="solar:export-bold" width={14} />
          </Link>
        </Tooltip>
      </Stack>

      <Typography
        variant="body1"
        sx={{ whiteSpace: 'pre-wrap', pr: { xs: 4, sm: 6 }, lineHeight: 1.6 }}
      >
        {verse.text}
      </Typography>
    </Card>
  );
}
