import type { BillingCycle } from '@prisma/client';
import type { SubscriptionRow, SubscriptionTotals } from '../types';

import { yearlyEquivalent } from './cycle-math';
import { BILLING_CYCLE_SHORT } from '../constants/billing-cycle';

export function computeSubscriptionTotals(rows: SubscriptionRow[]): SubscriptionTotals {
  let monthly = 0;
  let yearly = 0;
  let activeCount = 0;
  for (const r of rows) {
    if (!r.active) continue;
    activeCount += 1;
    monthly += r.monthlyEquivalent;
    yearly += yearlyEquivalent(r.amount, r.cycle);
  }
  return { monthlyEquivalent: monthly, yearlyEquivalent: yearly, activeCount };
}

export function dueLabel(daysUntilDue: number, cycle: BillingCycle): string {
  if (daysUntilDue < 0) return `Quá hạn ${Math.abs(daysUntilDue)} ngày`;
  if (daysUntilDue === 0) return 'Đến hạn hôm nay';
  if (daysUntilDue === 1) return 'Đến hạn ngày mai';
  if (daysUntilDue <= 7) return `Đến hạn trong ${daysUntilDue} ngày`;
  return `Hàng ${BILLING_CYCLE_SHORT[cycle]}`;
}
