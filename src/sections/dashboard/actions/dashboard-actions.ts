'use server';

import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

// First day of given month (UTC) — same canonicalisation as budget-actions.
function firstOfMonth(d: dayjs.Dayjs) {
  return new Date(Date.UTC(d.year(), d.month(), 1));
}

// Inclusive lower bound, exclusive upper bound for a month range query.
function monthRange(d: dayjs.Dayjs) {
  return {
    gte: firstOfMonth(d),
    lt: firstOfMonth(d.add(1, 'month')),
  };
}

export type DashboardData = {
  monthLabel: string;
  totalExpense: number;
  totalIncome: number;
  prevMonthExpense: number;
  // null when previous month has 0 → percentage is undefined.
  expenseDeltaPct: number | null;
  // Expense-type categories with spend + budget limit. Drives the Chi donut
  // and the budget progress card.
  byCategory: Array<{
    categoryId: string;
    name: string;
    icon: string;
    color: string;
    spent: number;
    limit: number;
  }>;
  // Income-type categories with earnings. Drives the Thu tab in the donut.
  incomeByCategory: Array<{
    categoryId: string;
    name: string;
    icon: string;
    color: string;
    earned: number;
  }>;
  recent: Array<{
    id: string;
    amount: number;
    type: 'expense' | 'income';
    date: string;
    description: string | null;
    category: { id: string; name: string; icon: string; color: string };
  }>;
};

// Validates the YYYY-MM searchParam from the URL. Falls back to the current
// month for any malformed input rather than 400-ing — this is a navigational
// param, not a security boundary.
function parseMonthParam(month: string | undefined): dayjs.Dayjs {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const parsed = dayjs(`${month}-01`);
    if (parsed.isValid()) return parsed;
  }
  return dayjs();
}

export async function getDashboardData(monthParam?: string): Promise<DashboardData> {
  const user = await requireUser();
  const now = parseMonthParam(monthParam);
  const prevMonth = now.subtract(1, 'month');

  // Run all 4 queries in parallel — none depend on each other.
  const [thisMonthRows, prevMonthAggregate, categories, currentBudgets, recent] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, date: monthRange(now) },
      select: { amount: true, type: true, categoryId: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: user.id, type: 'expense', date: monthRange(prevMonth) },
      _sum: { amount: true },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { order: 'asc' },
    }),
    prisma.budget.findMany({
      where: { userId: user.id, month: firstOfMonth(now) },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: 5,
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
    }),
  ]);

  // Aggregate this month's totals.
  let totalExpense = 0;
  let totalIncome = 0;
  const spentByCategory = new Map<string, number>();
  const earnedByCategory = new Map<string, number>();
  for (const t of thisMonthRows) {
    const amt = Number(t.amount);
    if (t.type === 'expense') {
      totalExpense += amt;
      spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) ?? 0) + amt);
    } else {
      totalIncome += amt;
      earnedByCategory.set(t.categoryId, (earnedByCategory.get(t.categoryId) ?? 0) + amt);
    }
  }

  const prevMonthExpense = Number(prevMonthAggregate._sum.amount ?? new Prisma.Decimal(0));
  const expenseDeltaPct =
    prevMonthExpense === 0
      ? null
      : ((totalExpense - prevMonthExpense) / prevMonthExpense) * 100;

  const limitByCategory = new Map(currentBudgets.map((b) => [b.categoryId, Number(b.limit)]));

  // Split categories by type — Chi donut + budget rows use expense list,
  // Thu donut uses income list.
  const byCategory = categories
    .filter((c) => c.type === 'expense')
    .map((c) => ({
      categoryId: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      spent: spentByCategory.get(c.id) ?? 0,
      limit: limitByCategory.get(c.id) ?? 0,
    }));

  const incomeByCategory = categories
    .filter((c) => c.type === 'income')
    .map((c) => ({
      categoryId: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      earned: earnedByCategory.get(c.id) ?? 0,
    }));

  return {
    monthLabel: now.format('MM/YYYY'),
    totalExpense,
    totalIncome,
    prevMonthExpense,
    expenseDeltaPct,
    byCategory,
    incomeByCategory,
    recent: recent.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      type: r.type,
      date: r.date.toISOString(),
      description: r.description,
      category: r.category,
    })),
  };
}
