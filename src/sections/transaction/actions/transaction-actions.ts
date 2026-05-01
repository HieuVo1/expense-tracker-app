'use server';

import type { TransactionType } from '@prisma/client';

import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { prisma } from 'src/lib/prisma';
import { paths } from 'src/routes/paths';
import { requireUser } from 'src/lib/auth-helpers';

// `nullish()` = optional + nullable so OCR/DB can pass `null` directly.
// Schema parsers normalise to undefined-or-string downstream.
const createSchema = z.object({
  amount: z.number().int().min(1, 'Số tiền phải > 0'),
  type: z.enum(['expense', 'income']),
  categoryId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ'),
  description: z.string().max(200).nullish(),
  merchant: z.string().max(100).nullish(),
  receiptUrl: z.string().nullish(),
});

export type CreateTransactionInput = z.infer<typeof createSchema>;

// Batch create — used after OCR scan returns multiple transactions. Each item
// is validated independently; merchant memory is upserted for each. Wrapped in
// a transaction so partial failures don't leave the user with half the data.
export async function createTransactionsBatch(inputs: CreateTransactionInput[]) {
  const user = await requireUser();
  const parsed = inputs.map((i) => createSchema.parse(i));
  if (parsed.length === 0) return { count: 0 };

  // Verify every category belongs to user before opening the transaction.
  const categoryIds = Array.from(new Set(parsed.map((i) => i.categoryId)));
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds }, userId: user.id },
    select: { id: true },
  });
  const validIds = new Set(categories.map((c) => c.id));
  for (const i of parsed) {
    if (!validIds.has(i.categoryId)) {
      throw new Error(`Danh mục không hợp lệ: ${i.categoryId}`);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.createMany({
      data: parsed.map((i) => ({
        userId: user.id,
        categoryId: i.categoryId,
        amount: new Prisma.Decimal(i.amount),
        type: i.type,
        date: new Date(`${i.date}T00:00:00.000Z`),
        description: i.description?.trim() || null,
        receiptUrl: i.receiptUrl ?? null,
      })),
    });

    // Merchant memory upserts — sequential since unique constraint prevents
    // concurrent inserts and the volume is small (≤ 20 / scan).
    for (const i of parsed) {
      const normalized = i.merchant?.trim().toLowerCase();
      if (!normalized) continue;
      await tx.merchantMemory.upsert({
        where: { userId_merchant: { userId: user.id, merchant: normalized } },
        update: { categoryId: i.categoryId },
        create: { userId: user.id, merchant: normalized, categoryId: i.categoryId },
      });
    }
  });

  revalidatePath(paths.dashboard.transactions);
  revalidatePath(paths.dashboard.root);
  return { count: parsed.length };
}

export async function createTransaction(input: CreateTransactionInput) {
  const user = await requireUser();
  const data = createSchema.parse(input);

  // Verify category belongs to user — guards against tampering with categoryId
  // even though RLS would also reject the insert.
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, userId: user.id },
  });
  if (!category) {
    throw new Error('Danh mục không hợp lệ');
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      categoryId: data.categoryId,
      amount: new Prisma.Decimal(data.amount),
      type: data.type,
      date: new Date(`${data.date}T00:00:00.000Z`),
      description: data.description?.trim() || null,
      receiptUrl: data.receiptUrl ?? null,
    },
  });

  // Merchant Memory: remember which category the user picked for this merchant
  // so future scans of the same merchant pre-fill the same category.
  if (data.merchant) {
    const normalized = data.merchant.trim().toLowerCase();
    if (normalized) {
      await prisma.merchantMemory.upsert({
        where: { userId_merchant: { userId: user.id, merchant: normalized } },
        update: { categoryId: data.categoryId },
        create: { userId: user.id, merchant: normalized, categoryId: data.categoryId },
      });
    }
  }

  revalidatePath(paths.dashboard.transactions);
  revalidatePath(paths.dashboard.root);

  return transaction.id;
}

// Returns ALL categories so the form can switch between expense + income lists
// reactively as the user toggles type. The set is small (≤ ~15 rows) so we
// don't pay anything for fetching both types in one go.
export async function listCategoriesForForm() {
  const user = await requireUser();
  return prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ type: 'asc' }, { order: 'asc' }],
    select: { id: true, name: true, icon: true, color: true, type: true },
  });
}

export async function lookupMerchantCategory(merchant: string) {
  const user = await requireUser();
  const normalized = merchant.trim().toLowerCase();
  if (!normalized) return null;

  const memory = await prisma.merchantMemory.findUnique({
    where: { userId_merchant: { userId: user.id, merchant: normalized } },
  });
  return memory?.categoryId ?? null;
}

export type TransactionListFilter = {
  type?: TransactionType;
  categoryId?: string;
};

// Returns the user's transactions, optionally filtered, joined with their
// category for inline display. Caller pagination is via offset/take args.
export async function listTransactions(filter: TransactionListFilter = {}, take = 50) {
  const user = await requireUser();

  const where: Prisma.TransactionWhereInput = { userId: user.id };
  if (filter.type) where.type = filter.type;
  if (filter.categoryId) where.categoryId = filter.categoryId;

  const rows = await prisma.transaction.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take,
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });

  // Decimal → number for client serialisation; VND amounts comfortably fit in a
  // JS number (max safe integer is ≈ 9 * 10^15, well above any plausible amount).
  return rows.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    type: r.type,
    date: r.date.toISOString().slice(0, 10),
    description: r.description,
    receiptUrl: r.receiptUrl,
    category: r.category,
  }));
}

export async function deleteTransaction(id: string) {
  const user = await requireUser();
  await prisma.transaction.delete({ where: { id, userId: user.id } });
  revalidatePath(paths.dashboard.transactions);
  revalidatePath(paths.dashboard.root);
}
