'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import {
  RISK_PROFILE_COLORS,
  RISK_PROFILE_LABELS,
  type RiskProfile,
} from '../constants/risk-profiles';

type Props = {
  profile: RiskProfile | null;
  onChangeClick: () => void;
};

export function RiskProfileCard({ profile, onChangeClick }: Props) {
  const label = profile ? RISK_PROFILE_LABELS[profile] : 'Chưa khai';
  const color = profile ? RISK_PROFILE_COLORS[profile] : 'text.disabled';
  const buttonText = profile ? 'Đổi' : 'Chọn hồ sơ';

  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography variant="caption" color="text.secondary">
        Hồ sơ rủi ro
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ color, fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ mt: 'auto', pt: 1 }}>
        <Button size="small" variant="outlined" onClick={onChangeClick}>
          {buttonText}
        </Button>
      </Box>
    </Card>
  );
}
