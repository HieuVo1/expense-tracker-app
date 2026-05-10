import type { BillingCycle } from '@prisma/client';

export const BILLING_CYCLE_VALUES: BillingCycle[] = ['monthly', 'quarterly', 'yearly'];

export const BILLING_CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: 'Hàng tháng',
  quarterly: 'Hàng quý',
  yearly: 'Hàng năm',
};

export const BILLING_CYCLE_SHORT: Record<BillingCycle, string> = {
  monthly: 'tháng',
  quarterly: 'quý',
  yearly: 'năm',
};

// Months per cycle — used for monthly/yearly equivalent calculations.
export const BILLING_CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};
