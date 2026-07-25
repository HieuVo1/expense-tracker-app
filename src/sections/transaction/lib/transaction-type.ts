import type { TransactionType } from '@prisma/client';

// Single source of truth for the three transaction types. Mirrors the Prisma
// enum — `TRANSACTION_TYPES` is what Zod schemas and UI toggles iterate over, so
// adding a fourth type later means touching the enum, a migration, and this file.
export const TRANSACTION_TYPES = ['expense', 'income', 'investment'] as const;

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  expense: 'Chi',
  income: 'Thu',
  investment: 'Đầu tư',
};

// Sign shown next to an amount. Investment shares the minus sign with expense:
// the money has left the wallet, it just bought an asset instead of being spent.
export const TRANSACTION_TYPE_SIGN: Record<TransactionType, string> = {
  expense: '−',
  income: '+',
  investment: '−',
};

// Chart/legend hues. Chi and Thu keep the colors they've always had; Đầu tư
// takes the theme's secondary violet (themeConfig.palette.secondary.main),
// which separates cleanly from both under deuteranopia and protanopia
// (OKLab ΔE 35.1 vs green, 32.7 vs red — the safe floor is 8).
export const TRANSACTION_TYPE_COLOR: Record<TransactionType, string> = {
  expense: '#FF5630',
  income: '#22C55E',
  investment: '#8E33FF',
};

// Amount signed for cash-flow math: income adds, expense and investment both
// subtract. Every "net" or "số dư" figure in the app runs through this.
export function signedAmount(t: { type: TransactionType; amount: number }): number {
  return t.type === 'income' ? t.amount : -t.amount;
}

// Narrows an untrusted string (URL searchParam, CSV cell) to a valid type.
export function parseTransactionType(raw: string | null | undefined): TransactionType | undefined {
  return (TRANSACTION_TYPES as readonly string[]).includes(raw ?? '')
    ? (raw as TransactionType)
    : undefined;
}
