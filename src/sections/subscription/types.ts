import type { BillingCycle } from '@prisma/client';

export type SubscriptionRow = {
  id: string;
  name: string;
  amount: number;
  cycle: BillingCycle;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  nextDueDate: string; // YYYY-MM-DD
  active: boolean;
  notes: string | null;
  /** Days until nextDueDate (negative when overdue). */
  daysUntilDue: number;
  /** Amount divided by cycle length in months. */
  monthlyEquivalent: number;
  updatedAt: string; // ISO
};

export type SubscriptionTotals = {
  monthlyEquivalent: number;
  yearlyEquivalent: number;
  activeCount: number;
};
