'use client';

import type { PlanTaskRow } from '../types';

import { useDroppable } from '@dnd-kit/core';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { PlanCalendarTaskCard } from './plan-calendar-task-card';

// ----------------------------------------------------------------------

const DROP_ID = 'unscheduled';

type Props = {
  tasks: PlanTaskRow[];
};

export function PlanCalendarUnscheduledTray({ tasks }: Props) {
  const theme = useTheme();
  const { isOver, setNodeRef } = useDroppable({ id: DROP_ID, data: { unschedule: true } });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: `1px solid ${isOver ? theme.palette.primary.main : theme.palette.divider}`,
        bgcolor: isOver ? `${theme.palette.primary.main}0A` : 'background.paper',
        transition: 'border 0.15s, background 0.15s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Iconify icon="solar:inbox-bold" width={18} sx={{ color: 'text.secondary' }} />
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Chưa xếp lịch
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {tasks.length} việc
        </Typography>
      </Box>

      {tasks.length === 0 ? (
        <Typography
          variant="body2"
          color="text.disabled"
          sx={{ py: 2, textAlign: 'center', fontStyle: 'italic' }}
        >
          Mọi việc đã có chỗ. Kéo từ lịch sang đây để bỏ lịch.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 1,
          }}
        >
          {tasks.map((t) => (
            <PlanCalendarTaskCard key={t.id} task={t} />
          ))}
        </Box>
      )}
    </Box>
  );
}
