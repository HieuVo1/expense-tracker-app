'use server';

import type { SubscriptionRow } from '../types';
import type { SubscriptionFormValues } from '../schemas';

import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

import { subscriptionFormSchema } from '../schemas';
import { BILLING_CYCLE_LABEL } from '../constants/billing-cycle';
import { daysUntil, advanceDueDate, monthlyEquivalent } from '../utils/cycle-math';

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Form schema accepts any dayjs-parseable date (picker emits ISO with offset,
// seed values are YYYY-MM-DD). Narrow to a date-only UTC midnight here.
function toDateOnlyUtc(input: string): Date {
  const ymd = dayjs(input).format('YYYY-MM-DD');
  return new Date(`${ymd}T00:00:00.000Z`);
}

async function assertCategoryOwned(userId: string, categoryId: string) {
  const cat = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });
  if (!cat) throw new Error('Danh mục không hợp lệ');
}

export async function listSubscriptions(): Promise<SubscriptionRow[]> {
  const user = await requireUser();

  const rows = await prisma.subscription.findMany({
    where: { userId: user.id },
    include: { category: { select: { name: true, icon: true, color: true } } },
    orderBy: [{ active: 'desc' }, { nextDueDate: 'asc' }],
  });

  return rows.map((r) => {
    const amount = Number(r.amount);
    const nextDueDate = toDateString(r.nextDueDate);
    return {
      id: r.id,
      name: r.name,
      amount,
      cycle: r.cycle,
      categoryId: r.categoryId,
      categoryName: r.category.name,
      categoryIcon: r.category.icon,
      categoryColor: r.category.color,
      nextDueDate,
      active: r.active,
      notes: r.notes,
      daysUntilDue: daysUntil(nextDueDate),
      monthlyEquivalent: monthlyEquivalent(amount, r.cycle),
      updatedAt: r.updatedAt.toISOString(),
    };
  });
}

export async function createSubscription(
  input: SubscriptionFormValues,
): Promise<{ id: string }> {
  const user = await requireUser();
  const data = subscriptionFormSchema.parse(input);
  await assertCategoryOwned(user.id, data.categoryId);

  const created = await prisma.subscription.create({
    data: {
      userId: user.id,
      categoryId: data.categoryId,
      name: data.name.trim(),
      amount: new Prisma.Decimal(data.amount),
      cycle: data.cycle,
      nextDueDate: toDateOnlyUtc(data.nextDueDate),
      notes: data.notes?.trim() || null,
    },
    select: { id: true },
  });

  revalidatePath(paths.dashboard.subscriptions);
  revalidatePath(paths.dashboard.root);
  return { id: created.id };
}

export async function updateSubscription(
  id: string,
  input: SubscriptionFormValues,
): Promise<void> {
  const user = await requireUser();
  const data = subscriptionFormSchema.parse(input);
  await assertCategoryOwned(user.id, data.categoryId);

  const result = await prisma.subscription.updateMany({
    where: { id, userId: user.id },
    data: {
      categoryId: data.categoryId,
      name: data.name.trim(),
      amount: new Prisma.Decimal(data.amount),
      cycle: data.cycle,
      nextDueDate: toDateOnlyUtc(data.nextDueDate),
      notes: data.notes?.trim() || null,
    },
  });
  if (result.count === 0) throw new Error('NOT_FOUND');

  revalidatePath(paths.dashboard.subscriptions);
  revalidatePath(paths.dashboard.root);
}

export async function deleteSubscription(id: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.subscription.deleteMany({ where: { id, userId: user.id } });
  if (result.count === 0) throw new Error('NOT_FOUND');

  revalidatePath(paths.dashboard.subscriptions);
  revalidatePath(paths.dashboard.root);
}

export async function setSubscriptionActive(id: string, active: boolean): Promise<void> {
  const user = await requireUser();
  const result = await prisma.subscription.updateMany({
    where: { id, userId: user.id },
    data: { active },
  });
  if (result.count === 0) throw new Error('NOT_FOUND');

  revalidatePath(paths.dashboard.subscriptions);
  revalidatePath(paths.dashboard.root);
}

// Records a payment: creates an expense Transaction at today's date and rolls
// nextDueDate forward by one cycle. Wrapped in a single DB transaction so we
// never advance the due date without also recording the spend.
export async function markSubscriptionPaid(id: string): Promise<{ transactionId: string }> {
  const user = await requireUser();

  const sub = await prisma.subscription.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      name: true,
      amount: true,
      cycle: true,
      categoryId: true,
      nextDueDate: true,
    },
  });
  if (!sub) throw new Error('NOT_FOUND');

  const dueStr = toDateString(sub.nextDueDate);
  const newDue = advanceDueDate(dueStr, sub.cycle);

  // Stamp transaction at the due date 12:00 UTC — keeps it on the right day
  // regardless of when the user clicks "Đã thanh toán" (could be days late).
  const txnDate = new Date(`${dueStr}T12:00:00.000Z`);
  const description = `${sub.name} (${BILLING_CYCLE_LABEL[sub.cycle].toLowerCase()})`;

  const txn = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        userId: user.id,
        categoryId: sub.categoryId,
        amount: sub.amount,
        type: 'expense',
        date: txnDate,
        description,
      },
      select: { id: true },
    });

    await tx.subscription.update({
      where: { id: sub.id },
      data: { nextDueDate: new Date(`${newDue}T00:00:00.000Z`) },
    });

    return created;
  });

  revalidatePath(paths.dashboard.subscriptions);
  revalidatePath(paths.dashboard.transactions);
  revalidatePath(paths.dashboard.root);

  return { transactionId: txn.id };
}
