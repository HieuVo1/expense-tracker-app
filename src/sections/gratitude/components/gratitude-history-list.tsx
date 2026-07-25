'use client';

import type { GratitudeEntryRow } from '../types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { GRATITUDE_ACCENT } from '../constants/gratitude';
import { GratitudeEditDialog } from './gratitude-edit-dialog';

// ----------------------------------------------------------------------

type Props = { entries: GratitudeEntryRow[] };

export function GratitudeHistoryList({ entries }: Props) {
  const [editing, setEditing] = useState<GratitudeEntryRow | null>(null);

  if (entries.length === 0) {
    return (
      <Stack alignItems="center" spacing={1} sx={{ py: 6, color: 'text.disabled' }}>
        <Iconify icon="solar:notebook-bold-duotone" width={40} />
        <Typography variant="body2">Chưa có ngày nào trước đây.</Typography>
      </Stack>
    );
  }

  return (
    <>
      <Stack spacing={2}>
        {entries.map((entry) => (
          <Card key={entry.id} sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Iconify
                icon="solar:calendar-date-bold"
                width={18}
                sx={{ color: GRATITUDE_ACCENT }}
              />
              <Typography variant="subtitle2">{fDate(entry.date, 'DD/MM/YYYY')}</Typography>
              <Chip
                size="small"
                label={`${entry.items.length} điều`}
                sx={{ height: 20, bgcolor: alpha(GRATITUDE_ACCENT, 0.16), color: GRATITUDE_ACCENT }}
              />
              <IconButton
                size="small"
                aria-label="Sửa"
                sx={{ ml: 'auto', color: 'text.secondary', '&:hover': { color: GRATITUDE_ACCENT } }}
                onClick={() => setEditing(entry)}
              >
                <Iconify icon="solar:pen-bold" width={16} />
              </IconButton>
            </Stack>
            <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 0, listStyle: 'none' }}>
              {entry.items.map((item, i) => (
                <Box
                  key={i}
                  component="li"
                  sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
                >
                  <Iconify
                    icon="solar:heart-bold"
                    width={14}
                    sx={{ mt: '3px', flexShrink: 0, color: GRATITUDE_ACCENT }}
                  />
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Card>
        ))}
      </Stack>

      <GratitudeEditDialog entry={editing} open={!!editing} onClose={() => setEditing(null)} />
    </>
  );
}
