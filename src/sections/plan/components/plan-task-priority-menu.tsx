'use client';

import type { TaskPriority } from '@prisma/client';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import {
  TASK_PRIORITY_ICON,
  TASK_PRIORITY_ORDER,
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_COLOR,
} from '../constants/task-priority';

// ----------------------------------------------------------------------

type Props = {
  anchorEl: HTMLElement | null;
  current: TaskPriority | null;
  onSelect: (priority: TaskPriority) => void;
  onClose: () => void;
};

export function PlanTaskPriorityMenu({ anchorEl, current, onSelect, onClose }: Props) {
  const theme = useTheme();

  const getColor = (p: TaskPriority) => {
    const key = TASK_PRIORITY_COLOR[p];
    if (key === 'default') return theme.palette.text.disabled;
    return theme.palette[key].main;
  };

  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      {TASK_PRIORITY_ORDER.map((p) => (
        <MenuItem
          key={p}
          selected={p === current}
          onClick={() => {
            onSelect(p);
            onClose();
          }}
          sx={{ gap: 1.5, minWidth: 220 }}
        >
          <Iconify icon={TASK_PRIORITY_ICON[p]} sx={{ color: getColor(p), flexShrink: 0 }} />
          <Typography variant="body2" sx={{ flex: 1 }}>
            {TASK_PRIORITY_LABEL[p]}
          </Typography>
          {p === current && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: getColor(p),
                flexShrink: 0,
              }}
            />
          )}
        </MenuItem>
      ))}
    </Menu>
  );
}
