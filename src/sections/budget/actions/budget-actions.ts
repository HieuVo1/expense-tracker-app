'use server';

import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { prisma } from 'src/lib/prisma';
import { paths } from 'src/routes/paths';
import { requireUser } from 'src/lib/auth-helpers';

// First day of given month (UTC), used as the canonical key for Budget rows.
function firstOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

const upsertSchema = z.object({
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

export async function getBudgetsForCurrentMonth() {
  const user = await requireUser();
  const month = firstOfMonth(new Date());

  const [categories, budgets] = await Promise.all([
    prisma.category.findMany({
      where: { userId: user.id },
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

export async function upsertBudgets(input: { budgets: { categoryId: string; limit: number }[] }) {
  const user = await requireUser();
  const parsed = upsertSchema.parse(input);
  const month = firstOfMonth(new Date());

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

  revalidatePath(paths.dashboard.budgets);
}
