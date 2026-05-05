import type { PlanScope, PlanStatus } from '@prisma/client';

// ----------------------------------------------------------------------

export const PLAN_SCOPE_LABELS: Record<PlanScope, string> = {
  weekly: 'Tuần',
  monthly: 'Tháng',
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  active: 'Đang hoạt động',
  completed: 'Đã hoàn thành',
  archived: 'Đã lưu trữ',
};

export const PLAN_STATUS_COLORS: Record<PlanStatus, string> = {
  active: '#00A76F',
  completed: '#1976D2',
  archived: '#637381',
};

export const PLAN_SCOPE_VALUES: PlanScope[] = ['weekly', 'monthly'];
