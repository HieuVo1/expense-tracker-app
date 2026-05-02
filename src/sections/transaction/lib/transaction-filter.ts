import type { TransactionType } from '@prisma/client';

import { Prisma } from '@prisma/client';

// Shared filter shape consumed by `listTransactions` (paginated UI list) and
// `getTransactionsForExport` (CSV download). Keeping the shape and the
// where-clause builder in one place ensures the export always matches what
// the user sees on the transactions page.
export type TransactionListFilter = {
  type?: TransactionType;
  categoryId?: string;
  /** Free-text query — matches against description (Postgres ILIKE, accent-insensitive). */
  q?: string;
  /** YYYY-MM. Filters to transactions whose UTC date falls in this calendar month. */
  month?: string;
  /** YYYY-MM-DD. Filters to a single UTC day. Wins over `month` if both are set. */
  day?: string;
  /** Inclusive lower bound on transaction amount (VND, integer). */
  minAmount?: number;
  /** Inclusive upper bound on transaction amount (VND, integer). */
  maxAmount?: number;
};

const MONTH_RE = /^\d{4}-\d{2}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// [start, end) UTC range for either a YYYY-MM-DD day or YYYY-MM month.
// Returns null when neither input is a recognisable date — the caller should
// then drop the date constraint entirely.
function buildDateRange(day?: string, month?: string): { gte: Date; lt: Date } | null {
  if (day && DAY_RE.test(day)) {
    const start = new Date(`${day}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { gte: start, lt: end };
  }
  if (month && MONTH_RE.test(month)) {
    const [y, m] = month.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    if (Number.isNaN(start.getTime())) return null;
    return { gte: start, lt: end };
  }
  return null;
}

// Builds the Prisma where clause for one user's transactions, applying every
// supported filter dimension. Always scopes by userId; never returns rows
// belonging to anyone else.
export function buildTransactionWhere(
  userId: string,
  filter: TransactionListFilter = {}
): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { userId };

  if (filter.type) where.type = filter.type;
  if (filter.categoryId) where.categoryId = filter.categoryId;
  if (filter.q && filter.q.trim()) {
    where.description = { contains: filter.q.trim(), mode: 'insensitive' };
  }

  const dateRange = buildDateRange(filter.day, filter.month);
  if (dateRange) where.date = dateRange;

  if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
    const amountRange: Prisma.DecimalFilter = {};
    if (filter.minAmount !== undefined) amountRange.gte = new Prisma.Decimal(filter.minAmount);
    if (filter.maxAmount !== undefined) amountRange.lte = new Prisma.Decimal(filter.maxAmount);
    where.amount = amountRange;
  }

  return where;
}
