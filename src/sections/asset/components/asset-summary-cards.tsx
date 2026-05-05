import type { AssetTotals } from '../types';
import type { RiskProfile } from '../constants/risk-profiles';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { RiskProfileCard } from './risk-profile-card';

type Props = {
  totals: AssetTotals;
  riskProfile: RiskProfile | null;
  onChangeRiskProfile: () => void;
};

export function AssetSummaryCards({ totals, riskProfile, onChangeRiskProfile }: Props) {
  const { totalCurrentValue, totalCapital, totalPL, plPercent } = totals;
  const plPositive = totalPL >= 0;
  const plSign = plPositive ? '+' : '−';
  const plColor = totalPL === 0 ? 'text.primary' : plPositive ? 'success.dark' : 'error.main';

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
      }}
    >
      <MetricCard label="Tổng tài sản" value={fCurrency(totalCurrentValue)} />

      <MetricCard
        label="Tổng vốn"
        value={fCurrency(totalCapital)}
        valueColor="text.secondary"
      />

      <MetricCard
        label="Lời / Lỗ"
        value={`${plSign}${fCurrency(Math.abs(totalPL))}`}
        valueColor={plColor}
        footer={
          plPercent !== null ? (
            <Typography variant="caption" className="tabular" sx={{ color: plColor }}>
              {plSign}
              {Math.abs(plPercent).toFixed(2)}%
            </Typography>
          ) : null
        }
      />

      <RiskProfileCard profile={riskProfile} onChangeClick={onChangeRiskProfile} />
    </Box>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  valueColor?: string;
  footer?: React.ReactNode;
};

function MetricCard({ label, value, valueColor = 'text.primary', footer }: MetricCardProps) {
  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" className="tabular" sx={{ color: valueColor }}>
        {value}
      </Typography>
      {footer && <Box sx={{ mt: 0.5 }}>{footer}</Box>}
    </Card>
  );
}
