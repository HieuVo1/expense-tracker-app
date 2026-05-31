'use client';

import type { LifeArea } from '@prisma/client';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import {
  LIFE_AREA_ICON,
  LIFE_AREA_ORDER,
  LIFE_AREA_LABEL,
  LIFE_AREA_COLOR,
} from '../constants/life-area';

// ----------------------------------------------------------------------

type Props = {
  anchorEl: HTMLElement | null;
  current: LifeArea | null;
  onSelect: (area: LifeArea | null) => void;
  onClose: () => void;
};

export function PlanTaskLifeAreaMenu({ anchorEl, current, onSelect, onClose }: Props) {
  const theme = useTheme();

  const getColor = (a: LifeArea) => theme.palette[LIFE_AREA_COLOR[a]].main;

  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      {LIFE_AREA_ORDER.map((a) => (
        <MenuItem
          key={a}
          selected={a === current}
          onClick={() => {
            onSelect(a);
            onClose();
          }}
          sx={{ gap: 1.5, minWidth: 220 }}
        >
          <Iconify icon={LIFE_AREA_ICON[a]} sx={{ color: getColor(a), flexShrink: 0 }} />
          <Typography variant="body2" sx={{ flex: 1 }}>
            {LIFE_AREA_LABEL[a]}
          </Typography>
          {a === current && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: getColor(a),
                flexShrink: 0,
              }}
            />
          )}
        </MenuItem>
      ))}

      {current !== null && [
        <Divider key="divider" />,
        <MenuItem
          key="clear"
          onClick={() => {
            onSelect(null);
            onClose();
          }}
          sx={{ gap: 1.5, color: 'text.secondary' }}
        >
          <Iconify icon="solar:close-circle-bold" sx={{ flexShrink: 0 }} />
          <Typography variant="body2">Bỏ tag</Typography>
        </MenuItem>,
      ]}
    </Menu>
  );
}
