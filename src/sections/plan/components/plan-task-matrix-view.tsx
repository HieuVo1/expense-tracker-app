'use client';

import type { TaskPriority } from '@prisma/client';
import type { PlanTaskRow } from '../types';

import Box from '@mui/material/Box';

import { PlanTaskQuadrant } from './plan-task-quadrant';
import { TASK_PRIORITY_ORDER } from '../constants/task-priority';

// ----------------------------------------------------------------------

type Props = {
  tasks: PlanTaskRow[];
  onToggle: (id: string, isDone: boolean) => void;
  onRename: (id: string, title: string) => void;
  onChangePriority: (id: string, priority: TaskPriority) => void;
  onDelete: (id: string) => void;
};

export function PlanTaskMatrixView({ tasks, onToggle, onRename, onChangePriority, onDelete }: Props) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
        gap: 2,
      }}
    >
      {TASK_PRIORITY_ORDER.map((priority) => (
        <PlanTaskQuadrant
          key={priority}
          priority={priority}
          tasks={tasks.filter((t) => t.priority === priority)}
          onToggle={onToggle}
          onRename={onRename}
          onChangePriority={onChangePriority}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
}
