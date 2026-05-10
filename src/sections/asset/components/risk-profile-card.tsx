'use client';

import type { PaletteColorKey } from 'src/theme/core';
import type { IconifyName } from 'src/components/iconify';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

import { type RiskProfile, RISK_PROFILE_LABELS } from '../constants/risk-profiles';

// Match SummaryCard gradient look: each risk profile maps to a palette color
// + matching icon to give the card the same visual weight as its 3 siblings.
const RISK_PROFILE_PALETTE: Record<RiskProfile, PaletteColorKey> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
};

const RISK_PROFILE_ICON: Record<RiskProfile, IconifyName> = {
  LOW: 'solar:safe-2-bold',
  MEDIUM: 'solar:shield-check-bold',
  HIGH: 'solar:bolt-bold',
};

type Props = {
  profile: RiskProfile | null;
  onChangeClick: () => void;
};

export function RiskProfileCard({ profile, onChangeClick }: Props) {
  const theme = useTheme();
  const label = profile ? RISK_PROFILE_LABELS[profile] : 'Chưa khai';
  const color: PaletteColorKey = profile ? RISK_PROFILE_PALETTE[profile] : 'info';
  const icon: IconifyName = profile ? RISK_PROFILE_ICON[profile] : 'solar:shield-check-bold';
  const buttonText = profile ? 'Đổi' : 'Chọn hồ sơ';

  return (
    <Card
      sx={{
        p: 3,
        boxShadow: 'none',
        position: 'relative',
        color: `${color}.darker`,
        backgroundColor: 'common.white',
        backgroundImage: `linear-gradient(135deg, ${varAlpha(theme.vars.palette[color].lighterChannel, 0.48)}, ${varAlpha(theme.vars.palette[color].lightChannel, 0.48)})`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* "Đổi" button anchored top-right (mirror of SummaryCard's trending slot). */}
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={onChangeClick}
          sx={{
            borderColor: `${color}.main`,
            color: `${color}.darker`,
            '&:hover': { borderColor: `${color}.dark`, bgcolor: `${color}.lighter` },
          }}
        >
          {buttonText}
        </Button>
      </Box>

      <Box sx={{ width: 48, height: 48, mb: 3 }}>
        <Iconify icon={icon} width={48} />
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ mb: 1, typography: 'subtitle2' }}>Hồ sơ rủi ro</Box>
        <Box sx={{ typography: 'h4' }}>{label}</Box>
      </Box>

      <SvgColor
        src={`${CONFIG.assetsDir}/assets/background/shape-square.svg`}
        sx={{
          top: 0,
          left: -20,
          width: 240,
          zIndex: -1,
          height: 240,
          opacity: 0.24,
          position: 'absolute',
          color: `${color}.main`,
        }}
      />
    </Card>
  );
}
