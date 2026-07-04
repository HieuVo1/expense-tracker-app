import type { PlanScope, PlanStatus } from '@prisma/client';

// ----------------------------------------------------------------------

export const PLAN_SCOPE_LABELS: Record<PlanScope, string> = {
  weekly: 'Tuần',
  monthly: 'Tháng',
  yearly: 'Năm',
  backlog: 'Backlog',
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  active: 'Đang hoạt động',
  completed: 'Đã hoàn thành',
  archived: 'Đã lưu trữ',
};

export const PLAN_STATUS_COLORS: Record<PlanStatus, string> = {
  // Semantic success green (theme success.main) — not the brand primary.
  active: '#22C55E',
  completed: '#1976D2',
  archived: '#637381',
};

// Order matters: drives tab order. Backlog last.
export const PLAN_SCOPE_VALUES: PlanScope[] = ['weekly', 'monthly', 'yearly', 'backlog'];
