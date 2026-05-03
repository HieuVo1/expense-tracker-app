'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { prisma } from 'src/lib/prisma';
import { paths } from 'src/routes/paths';
import { requireUser } from 'src/lib/auth-helpers';

import type { AssetRow, CashDelta } from '../types';
import { assetFormSchema, type AssetFormValues } from '../schemas';

// Suggested delta for the banner — fetch the latest CASH updatedAt + sum of
// net transactions since then. Server only suggests; the user can override
// the amount in the picker before apply.
async function computeCashDelta(userId: string): Promise<CashDelta | null> {
  const latestCash = await prisma.asset.findFirst({
    where: { userId, type: 'CASH' },
    orderBy: { updatedAt: 'desc' },
    select: { updatedAt: true },
  });
  if (!latestCash) return null;

  // Use Transaction.updatedAt (vs createdAt) so edits surface in the banner —
  // a row edited after the anchor still has updatedAt > anchor even if it was
  // originally created before. Backdated entries also work since updatedAt =
  // createdAt on create. Trade-off: edited rows return their *current* amount,
  // not the diff vs the previously-synced amount, so the suggested delta can
  // double-count edits to already-absorbed transactions — the picker lets the
  // user override the amount before applying.
  const txns = await prisma.transaction.findMany({
    where: { userId, updatedAt: { gte: latestCash.updatedAt } },
    select: { amount: true, type: true },
  });
  if (txns.length === 0) return null;

  const delta = txns.reduce(
    (s, t) => s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)),
    0,
  );

  return { delta, count: txns.length, sinceISO: latestCash.updatedAt.toISOString() };
}

// Decimal → number, Date → ISO date string for client consumption.
export async function listAssets(): Promise<AssetRow[]> {
  const user = await requireUser();

  const rows = await prisma.asset.findMany({
    where: { userId: user.id },
    orderBy: [{ capital: 'desc' }, { createdAt: 'desc' }],
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    capital: Number(r.capital),
    currentValue: Number(r.currentValue),
    interestRate: r.interestRate,
    maturityDate: r.maturityDate ? r.maturityDate.toISOString().slice(0, 10) : null,
    notes: r.notes,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

// Coerces empty-string optional fields to null and forces SAVINGS-only fields
// to null when the type is not SAVINGS — keeps DB clean even if client UI lags.
function coerce(input: AssetFormValues) {
  const isSavings = input.type === 'SAVINGS';
  return {
    name: input.name.trim(),
    type: input.type as AssetRow['type'],
    capital: new Prisma.Decimal(input.capital),
    currentValue: new Prisma.Decimal(input.currentValue),
    interestRate: isSavings && input.interestRate ? Number(input.interestRate) : null,
    maturityDate:
      isSavings && input.maturityDate ? new Date(`${input.maturityDate}T00:00:00.000Z`) : null,
    notes: input.notes?.trim() || null,
  };
}

export async function createAsset(input: AssetFormValues): Promise<{ id: string }> {
  const user = await requireUser();
  const parsed = assetFormSchema.parse(input);
  const data = coerce(parsed);

  const created = await prisma.asset.create({
    data: { userId: user.id, ...data },
    select: { id: true },
  });

  revalidatePath(paths.dashboard.assets);
  return { id: created.id };
}

export async function updateAsset(
  input: { id: string } & AssetFormValues,
): Promise<void> {
  const user = await requireUser();
  const { id, ...rest } = input;
  const parsed = assetFormSchema.parse(rest);
  const data = coerce(parsed);

  // Defense-in-depth: where clause includes userId so a forged id from another
  // user updates 0 rows (RLS would catch this anyway).
  const result = await prisma.asset.updateMany({
    where: { id, userId: user.id },
    data,
  });

  if (result.count === 0) {
    throw new Error('Tài sản không tồn tại hoặc không có quyền chỉnh sửa');
  }

  revalidatePath(paths.dashboard.assets);
}

export async function deleteAsset(id: string): Promise<void> {
  const user = await requireUser();

  const result = await prisma.asset.deleteMany({
    where: { id, userId: user.id },
  });

  if (result.count === 0) {
    throw new Error('Tài sản không tồn tại hoặc không có quyền xoá');
  }

  revalidatePath(paths.dashboard.assets);
}

export async function getCashTransactionDelta(): Promise<CashDelta | null> {
  const user = await requireUser();
  return computeCashDelta(user.id);
}

// Applies a user-chosen `amount` to a CASH asset. The picker shows the
// computed delta as a default; user may edit it (e.g., subtract past tx they
// don't want to sync). The asset's updatedAt auto-bumps via @updatedAt and
// becomes the new anchor — every transaction in the previous window is then
// considered "absorbed", so future banners only show genuinely new tx.
export async function applyCashDelta(assetId: string, amount: number): Promise<void> {
  if (!Number.isFinite(amount)) {
    throw new Error('Số tiền không hợp lệ');
  }

  const user = await requireUser();

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, userId: user.id, type: 'CASH' },
    select: { id: true, currentValue: true },
  });
  if (!asset) {
    throw new Error('Tài sản không tồn tại hoặc không phải tiền mặt');
  }

  const newValue = Math.max(0, Number(asset.currentValue) + amount);
  await prisma.asset.update({
    where: { id: asset.id },
    data: { currentValue: new Prisma.Decimal(newValue) },
  });

  revalidatePath(paths.dashboard.assets);
}
