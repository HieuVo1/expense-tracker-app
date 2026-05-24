'use client';

import type { GratitudeEntryRow } from '../types';

import { useState } from 'react';

import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

import { GratitudeEditDialog } from './gratitude-edit-dialog';

// ----------------------------------------------------------------------

// Lets the user re-date today's saved entry (e.g. move it to a previous day)
// or tweak its content — reuses the same edit dialog as the history list.
type Props = { entry: GratitudeEntryRow };

export function GratitudeTodayEditButton({ entry }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="small"
        color="inherit"
        onClick={() => setOpen(true)}
        startIcon={<Iconify icon="solar:pen-bold" width={16} />}
      >
        Đổi ngày
      </Button>
      <GratitudeEditDialog entry={entry} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
