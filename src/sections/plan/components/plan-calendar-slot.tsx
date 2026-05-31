'use client';

import type { TimeSlot } from '@prisma/client';
import type { PlanTaskRow } from '../types';

import { useDroppable } from '@dnd-kit/core';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { PlanCalendarTaskCard } from './plan-calendar-task-card';

// ----------------------------------------------------------------------

type Props = {
  date: string; // YYYY-MM-DD
  slot: TimeSlot;
  tasks: PlanTaskRow[];
};

export function PlanCalendarSlot({ date, slot, tasks }: Props) {
  const theme = useTheme();
  // Drop id encodes both date and slot so the drop handler can decode.
  const dropId = `slot:${date}:${slot}`;
  const { isOver, setNodeRef } = useDroppable({ id: dropId, data: { date, slot } });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight: 96,
        p: 0.75,
        border: `1px dashed ${isOver ? theme.palette.primary.main : theme.palette.divider}`,
        borderRadius: 1,
        bgcolor: isOver ? `${theme.palette.primary.main}0A` : 'background.neutral',
        transition: 'background 0.15s, border 0.15s',
      }}
    >
      {tasks.length === 0 && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: 'text.disabled',
            fontStyle: 'italic',
            mt: 1.5,
            userSelect: 'none',
          }}
        >
          —
        </Typography>
      )}

      {tasks.map((t) => (
        <PlanCalendarTaskCard key={t.id} task={t} />
      ))}
    </Box>
  );
}
