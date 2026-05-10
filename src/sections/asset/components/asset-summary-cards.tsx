'use client';

import type { AssetTotals } from '../types';
import type { RiskProfile } from '../constants/risk-profiles';

import Grid from '@mui/material/Grid';

import { Iconify } from 'src/components/iconify';
import { SummaryCard } from 'src/components/summary-card';

import { RiskProfileCard } from './risk-profile-card';

// ----------------------------------------------------------------------

type Props = {
  totals: AssetTotals;
  riskProfile: RiskProfile | null;
  onChangeRiskProfile: () => void;
};

/**
 * Asset page top summary strip — 3 gradient SummaryCards + 1 risk-profile card.
 * Sparkline data: mock 6 flat points (no asset-value history in DB yet).
 * TODO: replace mock series with real monthly asset-value snapshots once history is stored.
 */
export function AssetSummaryCards({ totals, riskProfile, onChangeRiskProfile }: Props) {
  const { totalCurrentValue, totalCapital, totalPL } = totals;
  const plColor = totalPL === 0 ? 'primary' : totalPL > 0 ? 'success' : 'error';

  // No sparkline yet — asset value history not stored. Pass empty series to
  // hide chart cleanly (TODO: real monthly snapshots).
  const empty = { series: [], categories: [] };

  return (
    <Grid container spacing={3}>
      {/* Card 1 — Tổng tài sản (secondary purple — distinct from Lời/Lỗ green) */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard
          title="Tổng tài sản"
          total={totalCurrentValue}
          percent={0}
          color="secondary"
          icon={<Iconify icon="solar:money-bag-bold" width={48} />}
          chart={empty}
          format="currency"
        />
      </Grid>

      {/* Card 2 — Tổng vốn */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard
          title="Tổng vốn đầu tư"
          total={totalCapital}
          percent={0}
          color="info"
          icon={<Iconify icon="solar:banknote-bold" width={48} />}
          chart={empty}
          format="currency"
        />
      </Grid>

      {/* Card 3 — Lời / Lỗ */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard
          title="Lời / Lỗ"
          total={totalPL}
          percent={0}
          color={plColor}
          icon={<Iconify icon="solar:graph-up-bold" width={48} />}
          chart={empty}
          format="currency"
        />
      </Grid>

      {/* Card 4 — Risk profile (non-gradient, keeps existing style) */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <RiskProfileCard profile={riskProfile} onChangeClick={onChangeRiskProfile} />
      </Grid>
    </Grid>
  );
}

