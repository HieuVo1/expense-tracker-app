import type { AssetType } from '@prisma/client';

// Asset row shaped for client consumption: Decimal → number, Date → ISO date string.
// Matches the output of listAssets() in actions/asset-actions.ts.
export type AssetRow = {
  id: string;
  name: string;
  type: AssetType;
  capital: number;
  currentValue: number;
  interestRate: number | null;
  maturityDate: string | null; // YYYY-MM-DD
  notes: string | null;
  // ISO datetime — drives "Cập nhật N ngày trước" + stale warning. User
  // manages multiple wallets manually; transactions are not auto-synced.
  updatedAt: string;
};

export type AssetTotals = {
  totalCapital: number;
  totalCurrentValue: number;
  totalPL: number;
  // null when capital is 0 — pl% is undefined.
  plPercent: number | null;
  // currentValue grouped by AssetType. Keys present for all 5 types (0 if none).
  byType: Record<AssetType, number>;
};

// Per-asset profit/loss view-model.
export type AssetPL = {
  asset: AssetRow;
  pl: number;
  plPercent: number | null;
};

// Cash sync model — assumes "expense vào tiền mặt" (every transaction affects
// the user's cash bucket). Anchor = latest updatedAt among CASH assets;
// delta = net (income − expense − investment) for transactions logged after
// that anchor. Investment subtracts because the cash really did leave the
// wallet; the asset it bought is tracked as its own row.
export type CashDelta = {
  delta: number; // VND, signed (negative = net spend) — suggested default
  count: number;
  sinceISO: string; // ISO datetime of anchor (latest CASH updatedAt)
};
