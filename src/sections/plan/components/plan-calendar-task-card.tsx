'use client';

import type { PlanScope } from '@prisma/client';
import type { PlanTaskRow } from '../types';

import { CSS } from '@dnd-kit/utilities';
import { useDraggable } from '@dnd-kit/core';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { TASK_PRIORITY_COLOR } from '../constants/task-priority';
import { LIFE_AREA_ICON, LIFE_AREA_COLOR } from '../constants/life-area';

// ----------------------------------------------------------------------

// Accept any task shape that may carry source-plan metadata. The card stays
// usable for plain PlanTaskRow callers and adds a tiny scope chip when present.
type CalendarTask = PlanTaskRow & {
  planScope?: PlanScope;
  planTitle?: string;
};

type Props = {
  task: CalendarTask;
  dragId?: string;
};

const SCOPE_SHORT: Record<PlanScope, string> = {
  weekly: 'T',
  monthly: 'Th',
  yearly: 'N',
  backlog: 'B',
};

export function PlanCalendarTaskCard({ task, dragId }: Props) {
  const theme = useTheme();
  const id = dragId ?? task.id;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { taskId: task.id },
  });

  const priorityColor = TASK_PRIORITY_COLOR[task.priority];
  const accent =
    priorityColor === 'default' ? theme.palette.text.disabled : theme.palette[priorityColor].main;

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        p: 1,
        mb: 0.75,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `3px solid ${accent}`,
        cursor: 'grab',
        opacity: isDragging ? 0.4 : task.isDone ? 0.55 : 1,
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? 'none' : 'opacity 0.15s, box-shadow 0.15s',
        boxShadow: isDragging ? theme.shadows[8] : 'none',
        '&:hover': { boxShadow: theme.shadows[2] },
        '&:active': { cursor: 'grabbing' },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontWeight: 500,
          wordBreak: 'break-word',
          textDecoration: task.isDone ? 'line-through' : 'none',
          lineHeight: 1.3,
        }}
      >
        {task.title}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
        {task.lifeArea && (
          <Iconify
            icon={LIFE_AREA_ICON[task.lifeArea]}
            width={11}
            sx={{ color: theme.palette[LIFE_AREA_COLOR[task.lifeArea]].main }}
          />
        )}
        {task.planScope && (
          <Box
            title={task.planTitle}
            sx={{
              px: 0.5,
              py: 0,
              borderRadius: 0.5,
              fontSize: '0.55rem',
              fontWeight: 700,
              color: 'text.secondary',
              bgcolor: 'background.neutral',
              lineHeight: 1.4,
            }}
          >
            {SCOPE_SHORT[task.planScope]}
          </Box>
        )}
      </Box>
    </Box>
  );
}
