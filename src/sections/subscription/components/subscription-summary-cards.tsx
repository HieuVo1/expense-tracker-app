'use client';

import type { SubscriptionRow, SubscriptionTotals } from '../types';

import Grid from '@mui/material/Grid';

import { Iconify } from 'src/components/iconify';
import { SummaryCard } from 'src/components/summary-card';

// ----------------------------------------------------------------------

type Props = {
  totals: SubscriptionTotals;
  rows?: SubscriptionRow[];
};

/**
 * Subscription page top summary strip — 3 gradient SummaryCards.
 * Sparkline data: flat mock (no historical monthly sub-cost tracking yet).
 * TODO: replace mock with real monthly equivalent history once stored.
 */
export function SubscriptionSummaryCards({ totals, rows = [] }: Props) {
  const dueSoon = rows.filter((r) => r.active && r.daysUntilDue >= 0 && r.daysUntilDue <= 7).length;

  return (
    <Grid container spacing={3}>
      {/* Card 1 — Chi phí tháng */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard
          title="Chi phí tháng quy đổi"
          total={totals.monthlyEquivalent}
          percent={0}
          color="warning"
          icon={<Iconify icon="solar:calendar-date-bold" width={48} />}
          chart={{ series: [], categories: [] }}
          format="currency"
        />
      </Grid>

      {/* Card 2 — Chi phí năm quy đổi */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard
          title="Chi phí năm quy đổi"
          total={totals.yearlyEquivalent}
          percent={0}
          color="error"
          icon={<Iconify icon="solar:clock-circle-bold" width={48} />}
          chart={{ series: [], categories: [] }}
          format="currency"
        />
      </Grid>

      {/* Card 3 — Số subscription đang chạy */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard
          title="Đang hoạt động"
          total={totals.activeCount}
          percent={0}
          color="primary"
          icon={<Iconify icon="solar:bill-list-bold-duotone" width={48} />}
          chart={{ series: [], categories: [] }}
        />
      </Grid>

      {/* Card 4 — Sắp đến hạn trong 7 ngày */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard
          title="Sắp đến hạn (≤ 7 ngày)"
          total={dueSoon}
          percent={0}
          color="info"
          icon={<Iconify icon="solar:bell-bing-bold-duotone" width={48} />}
          chart={{ series: [], categories: [] }}
        />
      </Grid>
    </Grid>
  );
}
