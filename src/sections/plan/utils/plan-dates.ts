import type { PlanScope, PlanStatus } from '@prisma/client';

import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

// Extend once at module level — safe to call multiple times (dayjs guards duplicates)
dayjs.extend(isoWeek);

// ----------------------------------------------------------------------

/**
 * Returns suggested start/end dates for the given scope (current week or month).
 * Week starts Monday per VN convention (ISO week).
 */
export function suggestRange(scope: PlanScope, base = dayjs()): { startDate: string; endDate: string } {
  if (scope === 'weekly') {
    return {
      startDate: base.startOf('isoWeek').format('YYYY-MM-DD'),
      endDate: base.endOf('isoWeek').format('YYYY-MM-DD'),
    };
  }
  return {
    startDate: base.startOf('month').format('YYYY-MM-DD'),
    endDate: base.endOf('month').format('YYYY-MM-DD'),
  };
}

// ----------------------------------------------------------------------

/**
 * Returns true when today falls between startDate and endDate (inclusive)
 * and status is active.
 */
export function isPlanCurrent(row: {
  startDate: string;
  endDate: string;
  status: PlanStatus;
}): boolean {
  if (row.status !== 'active') return false;
  const today = dayjs().format('YYYY-MM-DD');
  return today >= row.startDate && today <= row.endDate;
}

// ----------------------------------------------------------------------

/**
 * Computes the next-period range starting the day after `currentEndDate`.
 * - weekly: 7-day window (next Mon–Sun if current ends Sunday)
 * - monthly: full following calendar month
 */
export function nextRange(
  scope: PlanScope,
  currentEndDate: string
): { startDate: string; endDate: string } {
  const start = dayjs(currentEndDate).add(1, 'day');
  if (scope === 'weekly') {
    return {
      startDate: start.format('YYYY-MM-DD'),
      endDate: start.add(6, 'day').format('YYYY-MM-DD'),
    };
  }
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: start.endOf('month').format('YYYY-MM-DD'),
  };
}
