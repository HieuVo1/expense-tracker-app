'use server';

import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

// First day of given month (UTC).
function firstOfMonth(d: dayjs.Dayjs) {
  return new Date(Date.UTC(d.year(), d.month(), 1));
}

export type ReportData = {
  // Last 6 months including current — oldest first so the chart reads left → right.
  monthlyTrend: Array<{ monthKey: string; label: string; expense: number; income: number }>;
  topTransactions: Array<{
    id: string;
    amount: number;
    date: string;
    description: string | null;
    category: { name: string; icon: string; color: string };
  }>;
  topMerchants: Array<{
    merchant: string;
    total: number;
    count: number;
    /** Most-used category for this merchant (best-effort label only). */
    primaryCategory: { name: string; color: string } | null;
  }>;
};

// YYYY-MM string from URL → dayjs anchor month. Falls back to current month
// for any malformed input — navigation param, not a security boundary.
function parseMonthParam(month: string | undefined): dayjs.Dayjs {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const parsed = dayjs(`${month}-01`);
    if (parsed.isValid()) return parsed;
  }
  return dayjs();
}

export async function getReportData(monthParam?: string): Promise<ReportData> {
  const user = await requireUser();
  const now = parseMonthParam(monthParam);
  // 6-month window ending at the selected month (inclusive).
  const sixMonthsAgoStart = firstOfMonth(now.subtract(5, 'month'));
  const nextMonthStart = firstOfMonth(now.add(1, 'month'));
  const currentMonthStart = firstOfMonth(now);

  const [windowRows, topTxs] = await Promise.all([
    // Aggregate set: 6 months of all transactions for the trend chart + merchant ranking.
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: sixMonthsAgoStart, lt: nextMonthStart } },
      select: {
        amount: true,
        type: true,
        date: true,
        description: true,
        category: { select: { name: true, color: true } },
      },
    }),
    // Top 5 expense transactions in the current month — informational, not aggregate.
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'expense',
        date: { gte: currentMonthStart, lt: nextMonthStart },
      },
      orderBy: { amount: 'desc' },
      take: 5,
      include: {
        category: { select: { name: true, icon: true, color: true } },
      },
    }),
  ]);

  // ─── monthlyTrend: bucket by YYYY-MM ────────────────────────────────
  const buckets = new Map<string, { expense: number; income: number }>();
  for (let i = 0; i < 6; i++) {
    const m = now.subtract(5 - i, 'month');
    buckets.set(m.format('YYYY-MM'), { expense: 0, income: 0 });
  }
  for (const r of windowRows) {
    const key = dayjs(r.date).format('YYYY-MM');
    const b = buckets.get(key);
    if (!b) continue;
    const amt = Number(r.amount);
    if (r.type === 'expense') b.expense += amt;
    else b.income += amt;
  }
  const monthlyTrend = Array.from(buckets.entries()).map(([monthKey, v]) => ({
    monthKey,
    label: dayjs(monthKey + '-01').format('MM/YYYY'),
    expense: v.expense,
    income: v.income,
  }));

  // ─── topMerchants: rank by total spend over 6 months ─────────────────
  // Merchant info lives only on the description field for OCR'd rows that
  // didn't capture a merchant — we group by description text in those cases
  // for a usable approximation. Pure aggregation by description is good
  // enough for a personal tracker.
  const merchantMap = new Map<
    string,
    { total: number; count: number; categoryCounts: Map<string, { color: string; n: number }> }
  >();
  for (const r of windowRows) {
    if (r.type !== 'expense') continue;
    const key = (r.description ?? '').trim();
    if (!key) continue;
    const slot = merchantMap.get(key) ?? {
      total: 0,
      count: 0,
      categoryCounts: new Map(),
    };
    slot.total += Number(r.amount);
    slot.count += 1;
    const cat = r.category;
    const cur = slot.categoryCounts.get(cat.name) ?? { color: cat.color, n: 0 };
    cur.n += 1;
    slot.categoryCounts.set(cat.name, cur);
    merchantMap.set(key, slot);
  }
  const topMerchants = Array.from(merchantMap.entries())
    .map(([merchant, v]) => {
      // Pick the dominant category for this merchant by frequency.
      let primaryCategory: { name: string; color: string } | null = null;
      let bestN = 0;
      for (const [name, info] of v.categoryCounts) {
        if (info.n > bestN) {
          bestN = info.n;
          primaryCategory = { name, color: info.color };
        }
      }
      return { merchant, total: v.total, count: v.count, primaryCategory };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    monthlyTrend,
    topTransactions: topTxs.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      date: r.date.toISOString().slice(0, 10),
      description: r.description,
      category: r.category,
    })),
    topMerchants,
  };
}

// CSV row shape for the export endpoint. Kept here so the type stays close to
// the Prisma model — when fields change they're updated in one place.
export type CsvRow = {
  date: string;
  type: string;
  amount: string;
  category: string;
  description: string;
  merchant: string;
};

export async function getTransactionsForExport(): Promise<CsvRow[]> {
  const user = await requireUser();
  const rows = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    include: { category: { select: { name: true } } },
  });

  // No merchant column in the schema — best-effort lookup via merchant memory:
  // we don't denormalise merchant onto Transaction, so this column stays empty
  // for now. A future migration could store merchant text on each row.
  return rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    type: r.type === 'expense' ? 'Chi' : 'Thu',
    amount: new Prisma.Decimal(r.amount).toString(),
    category: r.category.name,
    description: r.description ?? '',
    merchant: '',
  }));
}
