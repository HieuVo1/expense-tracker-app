'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { prisma } from 'src/lib/prisma';
import { paths } from 'src/routes/paths';
import { requireUser } from 'src/lib/auth-helpers';

import type { AssetRow } from '../types';
import { assetFormSchema, type AssetFormValues } from '../schemas';

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
