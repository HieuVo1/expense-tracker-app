'use client';

import type { AboutMeType } from '../types';
import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

import { ABOUT_ME_TYPE_ICONS, ABOUT_ME_TYPE_VALUES, ABOUT_ME_TYPE_COLORS, ABOUT_ME_TYPE_LABELS } from '../constants/about-me-types';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (type: AboutMeType) => void;
};

export function AboutMeTypePickerDialog({ open, onClose, onSelect }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Chọn loại ghi nhận</DialogTitle>
      <Divider />
      <DialogContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {ABOUT_ME_TYPE_VALUES.map((type) => (
            <Button
              key={type}
              fullWidth
              variant="outlined"
              onClick={() => {
                onSelect(type);
                onClose();
              }}
              startIcon={
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: ABOUT_ME_TYPE_COLORS[type],
                    flexShrink: 0,
                  }}
                >
                  <Iconify icon={ABOUT_ME_TYPE_ICONS[type] as IconifyName} width={18} />
                </Box>
              }
              sx={{
                justifyContent: 'flex-start',
                gap: 1,
                py: 1.25,
                px: 2,
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.lighter' },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {ABOUT_ME_TYPE_LABELS[type]}
              </Typography>
            </Button>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
