'use client';

import type { AssetRow } from '../types';

import dayjs from 'dayjs';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

import { computeAssetPL } from '../utils/compute-totals';
import { ASSET_TYPE_HEX, ASSET_TYPE_ICONS, ASSET_TYPE_LABELS } from '../constants/asset-types';

// Stale = more than 14 days since last manual update. Encourages re-syncing
// volatile assets (CASH/STOCK/CRYPTO move daily) without nagging on slow
// movers (SAVINGS/FUND).
const STALE_THRESHOLD_DAYS = 14;

function formatUpdatedAgo(updatedAt: string): { text: string; stale: boolean } {
  const days = dayjs().diff(dayjs(updatedAt), 'day');
  const stale = days >= STALE_THRESHOLD_DAYS;
  if (days <= 0) return { text: 'Cập nhật hôm nay', stale };
  if (days === 1) return { text: 'Cập nhật hôm qua', stale };
  if (days < 30) return { text: `Cập nhật ${days} ngày trước`, stale };
  const months = Math.floor(days / 30);
  return { text: `Cập nhật ${months} tháng trước`, stale };
}

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

  const updatedAgo = formatUpdatedAgo(asset.updatedAt);

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const closeMenu = () => setMenuAnchor(null);

  return (
    <Box
      sx={{
        py: 1.5,
        px: { xs: 1.5, sm: 2.5 },
        gap: { xs: 1.25, sm: 2 },
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
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {ASSET_TYPE_LABELS[asset.type]} · Vốn{' '}
          <span className="tabular">{fCurrency(asset.capital)}</span>
        </Typography>
        {showSavingsLine && (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: 'block' }}
          >
            {asset.interestRate !== null && (
              <span className="tabular">{asset.interestRate}%/năm</span>
            )}
            {asset.interestRate !== null && asset.maturityDate && ' · '}
            {asset.maturityDate && <>Đáo hạn {fDate(asset.maturityDate)}</>}
          </Typography>
        )}
        <Typography
          variant="caption"
          noWrap
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 0.25,
            color: updatedAgo.stale ? 'warning.main' : 'text.disabled',
          }}
        >
          {updatedAgo.stale && <Iconify icon="solar:clock-circle-bold" width={12} />}
          {updatedAgo.text}
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography variant="subtitle2" className="tabular" noWrap>
          {fCurrency(asset.currentValue)}
        </Typography>
        <Typography
          variant="caption"
          className="tabular"
          noWrap
          sx={{ color: plColor, display: 'block' }}
        >
          {plSign}
          {fCurrency(Math.abs(pl))}
          {plPercent !== null && (
            <> ({plSign}{Math.abs(plPercent).toFixed(1)}%)</>
          )}
        </Typography>
      </Box>

      <IconButton
        size="small"
        onClick={(e) => setMenuAnchor(e.currentTarget)}
        aria-label="Tuỳ chọn"
        sx={{ flexShrink: 0 }}
      >
        <Iconify icon="eva:more-vertical-fill" width={18} />
      </IconButton>

      <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            closeMenu();
            onEdit();
          }}
        >
          <ListItemIcon>
            <Iconify icon="solar:pen-bold" width={18} />
          </ListItemIcon>
          <ListItemText>Sửa</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            onDelete();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </ListItemIcon>
          <ListItemText>Xoá</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
