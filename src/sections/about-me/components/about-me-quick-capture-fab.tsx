'use client';

import type { AboutMeType } from '../types';

import { useState } from 'react';

import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from 'src/components/iconify';

import { AboutMeTypePickerDialog } from './about-me-type-picker-dialog';

// ----------------------------------------------------------------------

type Props = {
  onSelect: (type: AboutMeType) => void;
};

export function AboutMeQuickCaptureFab({ onSelect }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <Tooltip title="Ghi nhanh" placement="left">
        <Fab
          color="primary"
          onClick={() => setPickerOpen(true)}
          sx={{
            position: 'fixed',
            // Sit above the mobile bottom nav (64px + safe-area + 16px gap);
            // on desktop, no bottom nav so a smaller offset is enough.
            bottom: {
              xs: 'calc(64px + env(safe-area-inset-bottom) + 16px)',
              lg: 24,
            },
            right: { xs: 16, lg: 24 },
            zIndex: (t) => t.zIndex.fab,
            boxShadow: (t) => t.customShadows?.primary ?? 4,
          }}
        >
          <Iconify icon="mingcute:add-line" width={28} />
        </Fab>
      </Tooltip>

      <AboutMeTypePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(type) => {
          setPickerOpen(false);
          onSelect(type);
        }}
      />
    </>
  );
}
