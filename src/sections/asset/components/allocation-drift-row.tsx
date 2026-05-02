import type { AssetType } from '@prisma/client';

import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import {
  ASSET_TYPE_HEX,
  ASSET_TYPE_ICONS,
  ASSET_TYPE_LABELS,
} from '../constants/asset-types';

type Props = {
  type: AssetType;
  actualRatio: number;
  targetRatio: number;
  driftWarn: boolean;
};

export function AllocationDriftRow({ type, actualRatio, targetRatio, driftWarn }: Props) {
  const drift = actualRatio - targetRatio;
  const driftSign = drift > 0 ? '+' : drift < 0 ? '−' : '';
  const driftColor = !driftWarn
    ? 'text.secondary'
    : drift > 0
      ? 'error.main'
      : 'warning.main';

  const color = ASSET_TYPE_HEX[type];

  // Show actual as the bar fill; target marker is a thin vertical line.
  // When actual exceeds target by a lot the bar caps at 100% — drift % already
  // tells the story.
  const barValue = Math.min(actualRatio * 100, 100);
  const targetPct = targetRatio * 100;

  return (
    <Box
      sx={{
        py: 1.25,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderBottom: '0.5px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 1,
          bgcolor: `${color}1a`,
          color,
          flexShrink: 0,
        }}
      >
        <Iconify icon={ASSET_TYPE_ICONS[type]} width={16} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2">{ASSET_TYPE_LABELS[type]}</Typography>
          <Typography variant="caption" color="text.secondary" className="tabular">
            Mục tiêu {targetPct.toFixed(0)}% · Thực tế {(actualRatio * 100).toFixed(0)}%
          </Typography>
        </Box>

        <Box sx={{ position: 'relative' }}>
          <LinearProgress
            variant="determinate"
            value={barValue}
            sx={{
              height: 6,
              borderRadius: 1,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { bgcolor: color },
            }}
          />
          {/* Target marker */}
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              bottom: -2,
              left: `${targetPct}%`,
              width: 2,
              bgcolor: 'text.primary',
              borderRadius: 1,
            }}
          />
        </Box>
      </Box>

      <Typography
        variant="caption"
        className="tabular"
        sx={{ color: driftColor, minWidth: 56, textAlign: 'right', flexShrink: 0 }}
      >
        {driftSign}
        {Math.abs(drift * 100).toFixed(1)}%
      </Typography>
    </Box>
  );
}
