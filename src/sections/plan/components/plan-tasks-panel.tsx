'use client';

import type { TaskPriority } from '@prisma/client';
import type { PlanTaskRow } from '../types';

import { toast } from 'sonner';
import { useState, useEffect, useOptimistic, startTransition } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { PlanTaskList } from './plan-task-list';
import { PlanTaskAddInput } from './plan-task-add-input';
import { PlanTaskMatrixView } from './plan-task-matrix-view';
import { toggleTask, updateTask, deleteTask } from '../actions/plan-task-actions';

// ----------------------------------------------------------------------

const LS_KEY = 'plan-detail.tasks-tab';
type TabValue = 'matrix' | 'list';

type OptimisticPatch =
  | { id: string; isDone: boolean }
  | { id: string; priority: TaskPriority }
  | { id: string; _delete: true };

function reducer(state: PlanTaskRow[], patch: OptimisticPatch): PlanTaskRow[] {
  if ('_delete' in patch) return state.filter((t) => t.id !== patch.id);
  return state.map((t) =>
    t.id === patch.id ? { ...t, ...patch } : t
  );
}

// ----------------------------------------------------------------------

type Props = {
  planId: string;
  tasks: PlanTaskRow[];
};

export function PlanTasksPanel({ planId, tasks }: Props) {
  const [tab, setTab] = useState<TabValue>('matrix');

  const [optimisticTasks, applyOptimistic] = useOptimistic(tasks, reducer);

  // Restore tab from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY) as TabValue | null;
      if (stored === 'matrix' || stored === 'list') setTab(stored);
    } catch {
      // localStorage unavailable (SSR / private browsing)
    }
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, v: TabValue) => {
    setTab(v);
    try { localStorage.setItem(LS_KEY, v); } catch { /* ignore */ }
  };

  const onToggle = (id: string, isDone: boolean) => {
    startTransition(async () => {
      applyOptimistic({ id, isDone });
      try {
        await toggleTask(id, isDone);
      } catch {
        toast.error('Không cập nhật được');
      }
    });
  };

  const onRename = (id: string, title: string) => {
    startTransition(async () => {
      try {
        await updateTask(id, { title });
      } catch {
        toast.error('Không đổi tên được');
      }
    });
  };

  const onChangePriority = (id: string, priority: TaskPriority) => {
    startTransition(async () => {
      applyOptimistic({ id, priority });
      try {
        await updateTask(id, { priority });
      } catch {
        toast.error('Không thay đổi được độ ưu tiên');
      }
    });
  };

  const onDelete = (id: string) => {
    startTransition(async () => {
      applyOptimistic({ id, _delete: true });
      try {
        await deleteTask(id);
      } catch {
        toast.error('Không xoá được việc');
      }
    });
  };

  const callbacks = { onToggle, onRename, onChangePriority, onDelete };

  return (
    <Box>
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Ma trận" value="matrix" />
        <Tab label="Danh sách" value="list" />
      </Tabs>

      {tab === 'matrix' ? (
        <PlanTaskMatrixView tasks={optimisticTasks} {...callbacks} />
      ) : (
        <PlanTaskList tasks={optimisticTasks} {...callbacks} />
      )}

      <PlanTaskAddInput planId={planId} />
    </Box>
  );
}
