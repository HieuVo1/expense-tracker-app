'use client';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

import type { AssetRow } from '../types';
import { computeAssetPL } from '../utils/compute-totals';
import { ASSET_TYPE_HEX, ASSET_TYPE_ICONS, ASSET_TYPE_LABELS } from '../constants/asset-types';

type Props = {
  asset: AssetRow;
  onEdit: () => void;
  onDelete: () => void;
};

export function AssetListItem({ asset, onEdit, onDelete }: Props) {
  const { pl, plPercent } = computeAssetPL(asset);
  const plPositive = pl >= 0;
  const plSign = plPositive ? '+' : '−';
  const plColor = pl === 0 ? 'text.secondary' : plPositive ? 'success.dark' : 'error.main';

  const typeColor = ASSET_TYPE_HEX[asset.type];
  const showSavingsLine =
    asset.type === 'SAVINGS' && (asset.interestRate !== null || asset.maturityDate !== null);

  return (
    <Box
      sx={{
        py: 1.75,
        px: 2.5,
        gap: 2,
        display: 'flex',
        alignItems: 'center',
        borderBottom: '0.5px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 1,
          bgcolor: `${typeColor}1a`,
          color: typeColor,
          flexShrink: 0,
        }}
      >
        <Iconify icon={ASSET_TYPE_ICONS[asset.type]} width={20} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap>
          {asset.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {ASSET_TYPE_LABELS[asset.type]} · Vốn{' '}
          <span className="tabular">{fCurrency(asset.capital)}</span>
        </Typography>
        {showSavingsLine && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.25 }}
          >
            {asset.interestRate !== null && (
              <span className="tabular">{asset.interestRate}%/năm</span>
            )}
            {asset.interestRate !== null && asset.maturityDate && ' · '}
            {asset.maturityDate && <>Đáo hạn {fDate(asset.maturityDate)}</>}
          </Typography>
        )}
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography variant="subtitle2" className="tabular">
          {fCurrency(asset.currentValue)}
        </Typography>
        <Typography variant="caption" className="tabular" sx={{ color: plColor }}>
          {plSign}
          {fCurrency(Math.abs(pl))}
          {plPercent !== null && (
            <> ({plSign}{Math.abs(plPercent).toFixed(1)}%)</>
          )}
        </Typography>
      </Box>

      <IconButton size="small" onClick={onEdit} aria-label="Sửa" sx={{ ml: 0.5 }}>
        <Iconify icon="solar:pen-bold" width={18} />
      </IconButton>

      <IconButton size="small" onClick={onDelete} aria-label="Xoá">
        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
      </IconButton>
    </Box>
  );
}
