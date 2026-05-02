'use server';

import { z } from 'zod';
import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

// First day of given month (UTC), used as the canonical key for Budget rows.
function firstOfMonth(d: dayjs.Dayjs) {
  return new Date(Date.UTC(d.year(), d.month(), 1));
}

// Validates the YYYY-MM searchParam from the URL. Falls back to the current
// month for any malformed input — navigational param, not a security boundary.
function parseMonthParam(month: string | undefined): dayjs.Dayjs {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const parsed = dayjs(`${month}-01`);
    if (parsed.isValid()) return parsed;
  }
  return dayjs();
}

const upsertSchema = z.object({
  // YYYY-MM string from the form. Re-parsed server-side; client value is not trusted.
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Tháng không hợp lệ'),
  budgets: z
    .array(
      z.object({
        categoryId: z.string().min(1),
        // Numeric input from form — coerce so HTML number / string inputs both work.
        limit: z.coerce.number().int().min(0, 'Hạn mức không âm').max(999_999_999_999),
      })
    )
    .max(50),
});

// Loads expense-only categories (budgets don't apply to income) plus their
// limits for the requested month. Income categories are filtered out so the
// form doesn't show a row for them.
export async function getBudgetsForMonth(monthParam?: string) {
  const user = await requireUser();
  const month = firstOfMonth(parseMonthParam(monthParam));

  const [categories, budgets] = await Promise.all([
    prisma.category.findMany({
      where: { userId: user.id, type: 'expense' },
      orderBy: { order: 'asc' },
    }),
    prisma.budget.findMany({
      where: { userId: user.id, month },
    }),
  ]);

  // Project to a flat shape so the UI doesn't have to reconcile two arrays.
  const byCategory = new Map(budgets.map((b) => [b.categoryId, b.limit]));
  return categories.map((c) => ({
    categoryId: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    limit: Number(byCategory.get(c.id) ?? 0),
  }));
}

export async function upsertBudgets(input: {
  month: string;
  budgets: { categoryId: string; limit: number }[];
}) {
  const user = await requireUser();
  const parsed = upsertSchema.parse(input);
  const month = firstOfMonth(parseMonthParam(parsed.month));

  // Run all upserts in one transaction so the month either updates fully or not at all.
  await prisma.$transaction(
    parsed.budgets.map((b) =>
      prisma.budget.upsert({
        where: {
          userId_categoryId_month: {
            userId: user.id,
            categoryId: b.categoryId,
            month,
          },
        },
        update: { limit: new Prisma.Decimal(b.limit) },
        create: {
          userId: user.id,
          categoryId: b.categoryId,
          month,
          limit: new Prisma.Decimal(b.limit),
        },
      })
    )
  );

  // Dashboard's BudgetProgress reads from the same Budget table, so its RSC
  // cache must be invalidated too — otherwise the chart looks "hardcoded"
  // after the user saves a new limit.
  revalidatePath(paths.dashboard.budgets);
  revalidatePath(paths.dashboard.root);
}
