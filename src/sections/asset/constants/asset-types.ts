import type { AssetType } from '@prisma/client';

export const ASSET_TYPE_VALUES: AssetType[] = [
  'CASH',
  'STOCK',
  'FUND',
  'SAVINGS',
  'CRYPTO',
  'OTHER',
];

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  CASH: 'Tiền mặt',
  STOCK: 'Cổ phiếu',
  FUND: 'Chứng chỉ quỹ',
  SAVINGS: 'Tiết kiệm',
  CRYPTO: 'Tiền mã hoá',
  OTHER: 'Khác',
};

// Color tokens — using existing MUI palette family names from theme.
// These resolve at the component level via `theme.palette[X].main`.
export const ASSET_TYPE_PALETTE: Record<AssetType, string> = {
  CASH: 'success.main',
  STOCK: 'error.main',
  FUND: 'warning.main',
  SAVINGS: 'info.main',
  CRYPTO: 'warning.dark',
  OTHER: 'text.disabled',
};

// Concrete hex fallbacks for chart series (ApexCharts needs literal colors).
// Picked from MUI default palette tones to harmonise with theme.
// CRYPTO = bitcoin-orange — reads as crypto-themed even when icons can't.
export const ASSET_TYPE_HEX: Record<AssetType, string> = {
  CASH: '#22C55E',
  STOCK: '#EF4444',
  FUND: '#F59E0B',
  SAVINGS: '#06B6D4',
  CRYPTO: '#F7931A',
  OTHER: '#9CA3AF',
};

// Picked from already-registered icons in src/components/iconify/icon-sets.ts.
// To add new icons, register them there first.
import type { IconifyName } from 'src/components/iconify';

export const ASSET_TYPE_ICONS: Record<AssetType, IconifyName> = {
  CASH: 'solar:wad-of-money-bold',
  STOCK: 'solar:chart-square-outline',
  FUND: 'solar:bill-list-bold',
  SAVINGS: 'solar:case-minimalistic-bold',
  CRYPTO: 'solar:atom-bold-duotone',
  OTHER: 'solar:box-minimalistic-bold',
};
