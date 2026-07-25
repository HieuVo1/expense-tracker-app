'use client';

import type { LifeArea, TaskPriority } from '@prisma/client';
import type { PlanTaskRow, PlanMoveTarget } from '../types';

import { toast } from 'sonner';
import { useState, useEffect, useOptimistic, startTransition } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { PlanTaskList } from './plan-task-list';
import { PlanTaskAddInput } from './plan-task-add-input';
import { PlanTaskMatrixView } from './plan-task-matrix-view';
import { PlanTaskMoveDialog } from './plan-task-move-dialog';
import { toggleTask, updateTask, deleteTask, moveTaskToPlan } from '../actions/plan-task-actions';

// ----------------------------------------------------------------------

const LS_KEY = 'plan-detail.tasks-tab';
type TabValue = 'matrix' | 'list';

type OptimisticPatch =
  | { id: string; isDone: boolean }
  | { id: string; priority: TaskPriority }
  | { id: string; lifeArea: LifeArea | null }
  | { id: string; _delete: true };

function reducer(state: PlanTaskRow[], patch: OptimisticPatch): PlanTaskRow[] {
  if ('_delete' in patch) return state.filter((t) => t.id !== patch.id);
  return state.map((t) => (t.id === patch.id ? { ...t, ...patch } : t));
}

// ----------------------------------------------------------------------

type Props = {
  planId: string;
  tasks: PlanTaskRow[];
  moveTargets: PlanMoveTarget[];
};

export function PlanTasksPanel({ planId, tasks, moveTargets }: Props) {
  const [tab, setTab] = useState<TabValue>('matrix');
  const [moveTaskId, setMoveTaskId] = useState<string | null>(null);

  const [optimisticTasks, applyOptimistic] = useOptimistic(tasks, reducer);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY) as TabValue | null;
      if (stored === 'matrix' || stored === 'list') setTab(stored);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, v: TabValue) => {
    setTab(v);
    try {
      localStorage.setItem(LS_KEY, v);
    } catch {
      /* ignore */
    }
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

  const onChangeLifeArea = (id: string, lifeArea: LifeArea | null) => {
    startTransition(async () => {
      applyOptimistic({ id, lifeArea });
      try {
        await updateTask(id, { lifeArea });
      } catch {
        toast.error('Không gắn được khía cạnh');
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

  const onRequestMove = (taskId: string) => {
    if (moveTargets.length === 0) {
      toast.info('Chưa có kế hoạch tuần/tháng/năm đang hoạt động để chuyển đến.');
      return;
    }
    setMoveTaskId(taskId);
  };

  const handleMoveConfirm = async (targetPlanId: string) => {
    if (!moveTaskId) return;
    startTransition(async () => {
      applyOptimistic({ id: moveTaskId, _delete: true });
      try {
        await moveTaskToPlan(moveTaskId, targetPlanId);
        toast.success('Đã chuyển việc sang kế hoạch khác');
      } catch {
        toast.error('Không chuyển được việc');
      }
    });
    setMoveTaskId(null);
  };

  const callbacks = {
    onToggle,
    onRename,
    onChangePriority,
    onChangeLifeArea,
    onDelete,
    onRequestMove,
  };

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

      <PlanTaskMoveDialog
        open={Boolean(moveTaskId)}
        onClose={() => setMoveTaskId(null)}
        targets={moveTargets}
        onConfirm={handleMoveConfirm}
      />
    </Box>
  );
}
