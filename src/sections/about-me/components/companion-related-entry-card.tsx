'use client';

import type { NoteType } from '@prisma/client';
import type { IconifyName } from 'src/components/iconify';
import type { CompanionRelatedEntry } from '../actions/about-me-companion';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { GRATITUDE_ACCENT } from 'src/sections/gratitude/constants/gratitude';

import { ABOUT_ME_TYPE_ICONS, ABOUT_ME_TYPE_COLORS } from '../constants/about-me-types';

// ----------------------------------------------------------------------

type EntryType = NoteType | 'gratitude' | 'verse';

// daily + gratitude + verse aren't About-me types, so they have no entry in
// the About-me maps — supply their chip color + icon locally to keep this
// card self-contained.
const DAILY_COLOR = '#5d737e';
const DAILY_ICON: IconifyName = 'solar:calendar-date-bold';
const GRATITUDE_ICON: IconifyName = 'solar:hand-heart-bold';
const VERSE_COLOR = '#00A76F';
const VERSE_ICON: IconifyName = 'solar:book-bookmark-bold';

function chipColor(type: EntryType): string {
  if (type === 'daily') return DAILY_COLOR;
  if (type === 'gratitude') return GRATITUDE_ACCENT;
  if (type === 'verse') return VERSE_COLOR;
  return ABOUT_ME_TYPE_COLORS[type as keyof typeof ABOUT_ME_TYPE_COLORS];
}

function chipIcon(type: EntryType): IconifyName {
  if (type === 'daily') return DAILY_ICON;
  if (type === 'gratitude') return GRATITUDE_ICON;
  if (type === 'verse') return VERSE_ICON;
  return ABOUT_ME_TYPE_ICONS[type as keyof typeof ABOUT_ME_TYPE_ICONS];
}

// ----------------------------------------------------------------------

type Props = { entry: CompanionRelatedEntry };

export function CompanionRelatedEntryCard({ entry }: Props) {
  return (
    <Card
      component={RouterLink}
      href={entry.href}
      sx={{
        display: 'block',
        p: 2,
        textDecoration: 'none',
        color: 'inherit',
        transition: (t) => t.transitions.create(['box-shadow', 'transform']),
        '&:hover': { boxShadow: (t) => t.customShadows?.z8 ?? 6, transform: 'translateY(-2px)' },
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: chipColor(entry.type),
            flexShrink: 0,
          }}
        >
          <Iconify icon={chipIcon(entry.type)} width={16} />
        </Box>
        <Chip
          label={entry.typeLabel}
          size="small"
          sx={{ bgcolor: chipColor(entry.type), fontWeight: 600, fontSize: 12 }}
        />
        {entry.externalUrl && (
          <Tooltip title="Mở trên bible.com">
            <Link
              href={entry.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              sx={{ ml: 'auto', display: 'inline-flex', color: 'text.secondary', '&:hover': { color: chipColor(entry.type) } }}
            >
              <Iconify icon="solar:export-bold" width={14} />
            </Link>
          </Tooltip>
        )}
      </Stack>

      <Typography variant="subtitle2" sx={{ mb: 0.5 }} noWrap>
        {entry.title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {entry.content}
      </Typography>
    </Card>
  );
}
