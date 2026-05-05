import type { TaskPriority } from '@prisma/client';
import type { IconifyName } from 'src/components/iconify';

// Eisenhower order: Q1 → Q2 → Q3 → Q4
export const TASK_PRIORITY_ORDER: TaskPriority[] = [
  'do_first',
  'schedule',
  'delegate',
  'eliminate',
];

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  do_first: 'Khẩn cấp & Quan trọng',
  schedule: 'Quan trọng',
  delegate: 'Khẩn cấp',
  eliminate: 'Không quan trọng',
};

// MUI palette keys for color-coding quadrants
export const TASK_PRIORITY_COLOR: Record<
  TaskPriority,
  'error' | 'primary' | 'warning' | 'default'
> = {
  do_first: 'error',
  schedule: 'primary',
  delegate: 'warning',
  eliminate: 'default',
};

// Registered Solar icon names — verified against icon-sets.ts
export const TASK_PRIORITY_ICON: Record<TaskPriority, IconifyName> = {
  do_first: 'solar:danger-bold',           // Q1: urgent + important (red alert icon)
  schedule: 'solar:calendar-date-bold',    // Q2: important, schedule it
  delegate: 'solar:bolt-bold',             // Q3: urgent but delegate
  eliminate: 'solar:forbidden-circle-bold', // Q4: neither — eliminate
};
