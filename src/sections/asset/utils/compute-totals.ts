import type { AssetType } from '@prisma/client';
import type { AssetPL, AssetRow, AssetTotals } from '../types';

const EMPTY_BY_TYPE: Record<AssetType, number> = {
  CASH: 0,
  STOCK: 0,
  FUND: 0,
  SAVINGS: 0,
  CRYPTO: 0,
  OTHER: 0,
};

export function computeAssetPL(asset: AssetRow): AssetPL {
  const pl = asset.currentValue - asset.capital;
  const plPercent = asset.capital > 0 ? (pl / asset.capital) * 100 : null;
  return { asset, pl, plPercent };
}

export function computeTotals(assets: AssetRow[]): AssetTotals {
  const byType: Record<AssetType, number> = { ...EMPTY_BY_TYPE };
  let totalCapital = 0;
  let totalCurrentValue = 0;

  for (const a of assets) {
    totalCapital += a.capital;
    totalCurrentValue += a.currentValue;
    byType[a.type] += a.currentValue;
  }

  const totalPL = totalCurrentValue - totalCapital;
  const plPercent = totalCapital > 0 ? (totalPL / totalCapital) * 100 : null;

  return { totalCapital, totalCurrentValue, totalPL, plPercent, byType };
}
