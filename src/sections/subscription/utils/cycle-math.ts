import type { BillingCycle } from '@prisma/client';

import dayjs from 'dayjs';

import { BILLING_CYCLE_MONTHS } from '../constants/billing-cycle';

export function monthlyEquivalent(amount: number, cycle: BillingCycle): number {
  return Math.round(amount / BILLING_CYCLE_MONTHS[cycle]);
}

export function yearlyEquivalent(amount: number, cycle: BillingCycle): number {
  return Math.round((amount * 12) / BILLING_CYCLE_MONTHS[cycle]);
}

// Advance a YYYY-MM-DD due date by exactly one cycle. Uses dayjs month math
// so quarterly/yearly stay anchored to the same day-of-month (e.g. always 5th).
export function advanceDueDate(dueDate: string, cycle: BillingCycle): string {
  return dayjs(dueDate).add(BILLING_CYCLE_MONTHS[cycle], 'month').format('YYYY-MM-DD');
}

export function daysUntil(dateStr: string, today = dayjs().format('YYYY-MM-DD')): number {
  return dayjs(dateStr).diff(dayjs(today), 'day');
}
