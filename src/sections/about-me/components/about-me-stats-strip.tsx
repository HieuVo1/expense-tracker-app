'use client';

import type { AboutMeStats } from '../actions/about-me-stats';

import Grid from '@mui/material/Grid';

import { Iconify } from 'src/components/iconify';
import { SummaryCard } from 'src/components/summary-card';

// ----------------------------------------------------------------------

type Props = {
  stats: AboutMeStats;
};

/**
 * About-me stats strip — 4 gradient SummaryCards replacing the plain StatBox grid.
 * Sparkline data: flat mock (weekly granularity not stored in DB yet).
 * TODO: replace mock series with real weekly entry counts once history is tracked.
 */
export function AboutMeStatsStrip({ stats }: Props) {
  return (
    <Grid container spacing={3} sx={{ mb: 3.5 }}>
      {/* Card 1 — Tổng entries */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard
          title="Tổng entries"
          total={stats.totalEntries}
          percent={0}
          color="info"
          icon={<Iconify icon="solar:file-bold-duotone" width={48} />}
          chart={{ series: [], categories: [] }}
        />
      </Grid>

      {/* Card 2 — Bài học tuần này */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard
          title="Bài học tuần này"
          total={stats.lessonCount}
          percent={0}
          color="success"
          icon={<Iconify icon="solar:lightbulb-bolt-bold" width={48} />}
          chart={{ series: [], categories: [] }}
        />
      </Grid>

      {/* Card 3 — Tín hiệu tiêu cực tháng */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard
          title="Tín hiệu tiêu cực"
          total={stats.monthlyRedFlag}
          percent={0}
          color={stats.monthlyRedFlag > 0 ? 'error' : 'warning'}
          icon={<Iconify icon="solar:danger-bold" width={48} />}
          chart={{ series: [], categories: [] }}
        />
      </Grid>

      {/* Card 4 — Hành động đang chạy */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard
          title="Hành động đang chạy"
          total={stats.runningActions}
          percent={0}
          color="warning"
          icon={<Iconify icon="solar:list-bold" width={48} />}
          chart={{ series: [], categories: [] }}
        />
      </Grid>
    </Grid>
  );
}
