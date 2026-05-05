'use client';

import type { TaskPriority } from '@prisma/client';
import type { PlanTaskRow } from '../types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { PlanTaskItem } from './plan-task-item';
import {
  TASK_PRIORITY_ICON,
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_COLOR,
} from '../constants/task-priority';

// ----------------------------------------------------------------------

type Props = {
  priority: TaskPriority;
  tasks: PlanTaskRow[];
  onToggle: (id: string, isDone: boolean) => void;
  onRename: (id: string, title: string) => void;
  onChangePriority: (id: string, priority: TaskPriority) => void;
  onDelete: (id: string) => void;
};

export function PlanTaskQuadrant({
  priority,
  tasks,
  onToggle,
  onRename,
  onChangePriority,
  onDelete,
}: Props) {
  const theme = useTheme();
  const colorKey = TASK_PRIORITY_COLOR[priority];
  const color =
    colorKey === 'default' ? theme.palette.text.disabled : theme.palette[colorKey].main;

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `4px solid ${color}`,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Quadrant header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          bgcolor: `${color}10`,
        }}
      >
        <Iconify icon={TASK_PRIORITY_ICON[priority]} sx={{ color, flexShrink: 0 }} />
        <Typography variant="subtitle2" sx={{ flex: 1, color }}>
          {TASK_PRIORITY_LABEL[priority]}
        </Typography>
        <Box
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 1,
            bgcolor: `${color}20`,
            color,
            fontSize: '0.7rem',
            fontWeight: 700,
          }}
        >
          {tasks.length}
        </Box>
      </Box>

      {/* Task list */}
      <Stack sx={{ px: 1.5, py: 1, minHeight: 64 }}>
        {tasks.length === 0 ? (
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ py: 1, textAlign: 'center', fontStyle: 'italic' }}
          >
            — chưa có việc —
          </Typography>
        ) : (
          tasks.map((task) => (
            <PlanTaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onRename={onRename}
              onChangePriority={onChangePriority}
              onDelete={onDelete}
            />
          ))
        )}
      </Stack>
    </Box>
  );
}
