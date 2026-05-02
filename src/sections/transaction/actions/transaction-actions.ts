'use server';

import type { TransactionType } from '@prisma/client';

import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

// `nullish()` = optional + nullable so OCR/DB can pass `null` directly.
// Schema parsers normalise to undefined-or-string downstream.
//
// Wire format for `date`: `YYYY-MM-DDTHH:mm` — naive (no timezone). Server
// appends `:00.000Z` and stores as UTC. The wall-clock time the user typed
// is what gets persisted; we never apply timezone math.
const DATE_WIRE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const createSchema = z.object({
  amount: z.number().int().min(1, 'Số tiền phải > 0'),
  type: z.enum(['expense', 'income']),
  categoryId: z.string().min(1),
  date: z.string().regex(DATE_WIRE_RE, 'Ngày không hợp lệ'),
  description: z.string().max(200).nullish(),
  merchant: z.string().max(100).nullish(),
  receiptUrl: z.string().nullish(),
});

function wireToDate(wire: string) {
  return new Date(`${wire}:00.000Z`);
}

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
        date: wireToDate(i.date),
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
      date: wireToDate(data.date),
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
  /** Free-text query — matches against description (Postgres ILIKE, accent-insensitive). */
  q?: string;
};

// Returns the user's transactions, optionally filtered, joined with their
// category for inline display. Pagination via skip/take; fetches one extra
// row to detect whether more pages are available without a separate count(*).
export async function listTransactions(
  filter: TransactionListFilter = {},
  options: { take?: number; skip?: number } = {}
) {
  const user = await requireUser();
  const take = options.take ?? 50;
  const skip = options.skip ?? 0;

  const where: Prisma.TransactionWhereInput = { userId: user.id };
  if (filter.type) where.type = filter.type;
  if (filter.categoryId) where.categoryId = filter.categoryId;
  if (filter.q && filter.q.trim()) {
    // Case-insensitive substring search on the description column. Merchant
    // isn't stored on Transaction (only in MerchantMemory), so the user's
    // mental "search by who I sent money to" works only when they typed it
    // into the description field at create time. Good enough for v1.
    where.description = { contains: filter.q.trim(), mode: 'insensitive' };
  }

  const rows = await prisma.transaction.findMany({
    where,
    // `id` tiebreaker keeps order stable when ties exist on (date, createdAt) —
    // OCR batch inserts via createMany can produce identical createdAt within
    // a single Postgres transaction, and without a deterministic tiebreaker
    // rows visibly "jump" between queries after revalidation.
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take: take + 1,
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });

  const hasMore = rows.length > take;
  const trimmed = hasMore ? rows.slice(0, take) : rows;

  // Decimal → number for client serialisation; VND amounts comfortably fit in a
  // JS number (max safe integer is ≈ 9 * 10^15, well above any plausible amount).
  return {
    hasMore,
    rows: trimmed.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      type: r.type,
      // Full ISO datetime — client uses `slice(0, 10)` for day grouping and
      // `slice(11, 16)` for "HH:mm" display (avoids timezone shifts that a
      // dayjs parse without explicit UTC plugin would introduce).
      date: r.date.toISOString(),
      description: r.description,
      receiptUrl: r.receiptUrl,
      category: r.category,
    })),
  };
}

// Edit-only schema: restricted to fields the edit dialog exposes. Merchant
// memory is intentionally NOT touched on edit — that mapping is built up from
// initial classification and shouldn't churn when the user retroactively
// recategorises a row.
const updateSchema = z.object({
  id: z.string().min(1),
  amount: z.number().int().min(1, 'Số tiền phải > 0'),
  type: z.enum(['expense', 'income']),
  categoryId: z.string().min(1),
  date: z.string().regex(DATE_WIRE_RE, 'Ngày không hợp lệ'),
  description: z.string().max(200).nullish(),
});

export type UpdateTransactionInput = z.infer<typeof updateSchema>;

export async function updateTransaction(input: UpdateTransactionInput) {
  const user = await requireUser();
  const data = updateSchema.parse(input);

  // Verify category belongs to user — guards against tampering.
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, userId: user.id },
  });
  if (!category) throw new Error('Danh mục không hợp lệ');

  // Type and category must be consistent (no "Lương" expense).
  if (category.type !== data.type) {
    throw new Error('Loại giao dịch và danh mục không khớp');
  }

  await prisma.transaction.update({
    where: { id: data.id, userId: user.id },
    data: {
      categoryId: data.categoryId,
      amount: new Prisma.Decimal(data.amount),
      type: data.type,
      date: wireToDate(data.date),
      description: data.description?.trim() || null,
    },
  });

  revalidatePath(paths.dashboard.transactions);
  revalidatePath(paths.dashboard.root);
}

export async function deleteTransaction(id: string) {
  const user = await requireUser();
  await prisma.transaction.delete({ where: { id, userId: user.id } });
  revalidatePath(paths.dashboard.transactions);
  revalidatePath(paths.dashboard.root);
}
