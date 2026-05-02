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
