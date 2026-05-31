'use client';

import type { LifeArea, TaskPriority } from '@prisma/client';
import type { PlanTaskRow } from '../types';

import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { PlanTaskItem } from './plan-task-item';

// ----------------------------------------------------------------------

type Props = {
  tasks: PlanTaskRow[];
  onToggle: (id: string, isDone: boolean) => void;
  onRename: (id: string, title: string) => void;
  onChangePriority: (id: string, priority: TaskPriority) => void;
  onChangeLifeArea?: (id: string, area: LifeArea | null) => void;
  onDelete: (id: string) => void;
  onRequestMove?: (taskId: string) => void;
};

export function PlanTaskList({
  tasks,
  onToggle,
  onRename,
  onChangePriority,
  onChangeLifeArea,
  onDelete,
  onRequestMove,
}: Props) {
  if (tasks.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled" sx={{ py: 3, textAlign: 'center' }}>
        Chưa có việc nào — thêm việc đầu tiên ở dưới.
      </Typography>
    );
  }

  return (
    <Stack divider={<Divider />}>
      {tasks.map((task) => (
        <PlanTaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onRename={onRename}
          onChangePriority={onChangePriority}
          onChangeLifeArea={onChangeLifeArea}
          onDelete={onDelete}
          onRequestMove={onRequestMove}
        />
      ))}
    </Stack>
  );
}
