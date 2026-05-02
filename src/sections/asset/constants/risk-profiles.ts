import type { AssetType } from '@prisma/client';

export type RiskProfile = 'LOW' | 'MEDIUM' | 'HIGH';

export const RISK_PROFILE_VALUES: RiskProfile[] = ['LOW', 'MEDIUM', 'HIGH'];

export const RISK_PROFILE_LABELS: Record<RiskProfile, string> = {
  LOW: 'Bảo toàn vốn',
  MEDIUM: 'Cân bằng',
  HIGH: 'Tăng trưởng',
};

export const RISK_PROFILE_DESCRIPTIONS: Record<RiskProfile, string> = {
  LOW: 'Ưu tiên an toàn, ít biến động. Phù hợp với người mới hoặc cần dùng tiền trong 1–2 năm tới.',
  MEDIUM: 'Vừa giữ vốn vừa tăng trưởng. Phù hợp với mục tiêu trung hạn 3–5 năm.',
  HIGH: 'Chấp nhận rủi ro để lời cao. Phù hợp với mục tiêu dài hạn ≥ 5 năm.',
};

// V1 hardcoded target allocations. V2 will let users customise.
// CRYPTO target = 0 across all profiles — user opts in by buying; drift will
// surface as "vượt mục tiêu" hint, no prescriptive advice baked in.
export const RISK_TARGETS: Record<RiskProfile, Record<AssetType, number>> = {
  LOW: { CASH: 0.2, SAVINGS: 0.6, FUND: 0.15, STOCK: 0.05, CRYPTO: 0, OTHER: 0 },
  MEDIUM: { CASH: 0.1, SAVINGS: 0.35, FUND: 0.3, STOCK: 0.2, CRYPTO: 0.05, OTHER: 0 },
  HIGH: { CASH: 0.05, SAVINGS: 0.15, FUND: 0.3, STOCK: 0.4, CRYPTO: 0.1, OTHER: 0 },
};

// Drift threshold (absolute) above which we surface a rebalance hint.
export const DRIFT_WARN_THRESHOLD = 0.1;

// MUI palette tokens — for typography color (Typography sx).
export const RISK_PROFILE_COLORS: Record<RiskProfile, string> = {
  LOW: 'success.main',
  MEDIUM: 'warning.main',
  HIGH: 'error.main',
};

// Concrete hex equivalents — for selected-state tinted backgrounds where we
// need the `${hex}1a` alpha trick (palette tokens don't support that).
export const RISK_PROFILE_HEX: Record<RiskProfile, string> = {
  LOW: '#22C55E',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
};
