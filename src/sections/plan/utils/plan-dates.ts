import type { PlanScope, PlanStatus } from '@prisma/client';

import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

import { fTodayVN } from 'src/utils/format-time';

// Extend once at module level — safe to call multiple times (dayjs guards duplicates)
dayjs.extend(isoWeek);

// ----------------------------------------------------------------------

/**
 * Returns suggested start/end dates for the given scope.
 * - weekly: current ISO week (Mon–Sun per VN convention)
 * - monthly: current calendar month
 * - yearly: current calendar year
 * - backlog: null/null (no period)
 */
export function suggestRange(
  scope: PlanScope,
  base = dayjs()
): { startDate: string | null; endDate: string | null } {
  if (scope === 'backlog') {
    return { startDate: null, endDate: null };
  }
  if (scope === 'weekly') {
    return {
      startDate: base.startOf('isoWeek').format('YYYY-MM-DD'),
      endDate: base.endOf('isoWeek').format('YYYY-MM-DD'),
    };
  }
  if (scope === 'yearly') {
    return {
      startDate: base.startOf('year').format('YYYY-MM-DD'),
      endDate: base.endOf('year').format('YYYY-MM-DD'),
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
 * and status is active. Backlog plans are never "current" — they have no period.
 */
export function isPlanCurrent(row: {
  scope: PlanScope;
  startDate: string | null;
  endDate: string | null;
  status: PlanStatus;
}): boolean {
  if (row.status !== 'active') return false;
  if (row.scope === 'backlog') return false;
  if (!row.startDate || !row.endDate) return false;
  const today = fTodayVN();
  return today >= row.startDate && today <= row.endDate;
}

// ----------------------------------------------------------------------

/**
 * Computes the next-period range starting the day after `currentEndDate`.
 * - weekly: 7-day window
 * - monthly: full following calendar month
 * - yearly: next calendar year
 * - backlog: throws — no period to roll
 */
export function nextRange(
  scope: PlanScope,
  currentEndDate: string
): { startDate: string; endDate: string } {
  if (scope === 'backlog') throw new Error('ROLLOVER_NOT_SUPPORTED');
  const start = dayjs(currentEndDate).add(1, 'day');
  if (scope === 'weekly') {
    return {
      startDate: start.format('YYYY-MM-DD'),
      endDate: start.add(6, 'day').format('YYYY-MM-DD'),
    };
  }
  if (scope === 'yearly') {
    return {
      startDate: start.format('YYYY-MM-DD'),
      endDate: start.endOf('year').format('YYYY-MM-DD'),
    };
  }
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: start.endOf('month').format('YYYY-MM-DD'),
  };
}

// ----------------------------------------------------------------------

/**
 * True when range exactly matches a full calendar year (01/01 – 31/12).
 * Used to render "Năm 2026" instead of the verbose range.
 */
export function isFullYear(startDate: string | null, endDate: string | null): boolean {
  if (!startDate || !endDate) return false;
  const s = dayjs(startDate);
  const e = dayjs(endDate);
  return (
    s.year() === e.year() &&
    s.month() === 0 &&
    s.date() === 1 &&
    e.month() === 11 &&
    e.date() === 31
  );
}

// ----------------------------------------------------------------------

// Matches an auto-appended "(DD/MM – DD/MM)" / "(DD/MM/YYYY – DD/MM/YYYY)"
// suffix so re-applying a range (e.g. on rollover) replaces instead of stacking.
const TITLE_RANGE_SUFFIX = /\s*\(\d{2}\/\d{2}(?:\/\d{4})?\s*[–-]\s*\d{2}\/\d{2}(?:\/\d{4})?\)$/;

/**
 * Appends "(DD/MM – DD/MM)" (year shown only when the range crosses years)
 * to the title, replacing any previously appended range suffix. Returns the
 * bare title when dates are missing (backlog).
 */
export function withDateRangeInTitle(
  title: string,
  startDate: string | null,
  endDate: string | null
): string {
  const base = title.replace(TITLE_RANGE_SUFFIX, '').trim();
  if (!startDate || !endDate) return base;

  const s = dayjs(startDate);
  const e = dayjs(endDate);
  const range =
    s.year() === e.year()
      ? `${s.format('DD/MM')} – ${e.format('DD/MM')}`
      : `${s.format('DD/MM/YYYY')} – ${e.format('DD/MM/YYYY')}`;

  return `${base} (${range})`;
}

// ----------------------------------------------------------------------

/** Rollover button label adapts to scope. */
export function rolloverLabel(scope: PlanScope): string {
  if (scope === 'yearly') return 'Cuộn sang năm sau';
  if (scope === 'monthly') return 'Cuộn sang tháng sau';
  if (scope === 'weekly') return 'Cuộn sang tuần sau';
  return '';
}
