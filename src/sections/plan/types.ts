import type { PlanScope, PlanStatus, TaskPriority } from '@prisma/client';

// ----------------------------------------------------------------------

export type PlanRow = {
  id: string;
  scope: PlanScope;
  title: string;
  description: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: PlanStatus;
  doneCount: number;
  totalCount: number;
  /** progress 0-100 */
  progress: number;
  /** true when today is between startDate–endDate and status=active */
  isCurrent: boolean;
  createdAt: string; // ISO
};

// ----------------------------------------------------------------------

export type PlanTaskRow = {
  id: string;
  title: string;
  isDone: boolean;
  priority: TaskPriority;
  dueDate: string | null; // YYYY-MM-DD
  order: number;
  createdAt: string; // ISO
};

// ----------------------------------------------------------------------

export type PlanDetail = PlanRow & {
  tasks: PlanTaskRow[];
};
