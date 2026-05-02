import type { AssetType } from '@prisma/client';

import { ASSET_TYPE_VALUES } from '../constants/asset-types';
import {
  RISK_TARGETS,
  RISK_PROFILE_VALUES,
  type RiskProfile,
} from '../constants/risk-profiles';

export type Allocation = Record<AssetType, number>; // ratios, sum to 1

// Returns null when total is 0 — caller renders "no data".
export function calcAllocation(byType: Record<AssetType, number>): Allocation | null {
  const total = ASSET_TYPE_VALUES.reduce((s, t) => s + (byType[t] ?? 0), 0);
  if (total <= 0) return null;
  const allocation = {} as Allocation;
  for (const t of ASSET_TYPE_VALUES) {
    allocation[t] = (byType[t] ?? 0) / total;
  }
  return allocation;
}

// Euclidean distance over the 5 asset-type dimensions. Used to suggest the
// closest profile to the user's actual mix.
function distance(a: Allocation, b: Record<AssetType, number>): number {
  return Math.sqrt(
    ASSET_TYPE_VALUES.reduce((s, k) => s + ((a[k] ?? 0) - (b[k] ?? 0)) ** 2, 0),
  );
}

export function suggestProfile(actual: Allocation): RiskProfile {
  return RISK_PROFILE_VALUES.reduce((best, p) =>
    distance(actual, RISK_TARGETS[p]) < distance(actual, RISK_TARGETS[best]) ? p : best,
  );
}

// Per-type drift = actual - target. Positive = over-allocated, negative = under.
export function calcDrift(
  actual: Allocation,
  profile: RiskProfile,
): Record<AssetType, number> {
  const target = RISK_TARGETS[profile];
  const drift = {} as Record<AssetType, number>;
  for (const t of ASSET_TYPE_VALUES) {
    drift[t] = (actual[t] ?? 0) - (target[t] ?? 0);
  }
  return drift;
}

// Human-readable rebalance hints — only emit for types whose absolute drift
// exceeds the threshold.
const ASSET_TYPE_LABEL_HINTS: Record<AssetType, string> = {
  CASH: 'Tiền mặt',
  STOCK: 'Cổ phiếu',
  FUND: 'Chứng chỉ quỹ',
  SAVINGS: 'Tiết kiệm',
  CRYPTO: 'Tiền mã hoá',
  OTHER: 'Khoản khác',
};

export function rebalanceHints(
  drift: Record<AssetType, number>,
  threshold: number,
): string[] {
  const hints: string[] = [];
  for (const t of ASSET_TYPE_VALUES) {
    const d = drift[t];
    if (Math.abs(d) <= threshold) continue;
    const pct = Math.abs(d * 100).toFixed(0);
    const label = ASSET_TYPE_LABEL_HINTS[t];
    if (d > 0) {
      hints.push(`${label} đang vượt mục tiêu ${pct}% — cân nhắc giảm`);
    } else {
      hints.push(`${label} đang thiếu ${pct}% so với mục tiêu — cân nhắc tăng`);
    }
  }
  return hints;
}
