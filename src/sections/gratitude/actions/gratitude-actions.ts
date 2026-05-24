'use server';

import type { GratitudeEntryRow } from '../types';

import dayjs from 'dayjs';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

import { gratitudeUpsertSchema, gratitudeUpdateSchema } from '../schemas';

// ----------------------------------------------------------------------

// "Today" as a naive UTC calendar date — matches the rest of the app's
// timezone-free date handling (see dashboard-reminders.ts).
function todayDate(): Date {
  return new Date(dayjs().format('YYYY-MM-DD'));
}

function toRow(r: {
  id: string;
  date: Date;
  items: string[];
  createdAt: Date;
  updatedAt: Date;
}): GratitudeEntryRow {
  return {
    id: r.id,
    date: r.date.toISOString().slice(0, 10),
    items: r.items,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ----------------------------------------------------------------------

export async function getTodayGratitude(): Promise<GratitudeEntryRow | null> {
  const user = await requireUser();

  const row = await prisma.gratitudeEntry.findUnique({
    where: { userId_date: { userId: user.id, date: todayDate() } },
  });

  return row ? toRow(row) : null;
}

export async function listGratitude(limit = 60): Promise<GratitudeEntryRow[]> {
  const user = await requireUser();

  const rows = await prisma.gratitudeEntry.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: limit,
  });

  return rows.map(toRow);
}

// Upsert today's entry. At least 1 item enforced via Zod.
export async function upsertTodayGratitude(items: string[]): Promise<void> {
  const user = await requireUser();
  const { items: clean } = gratitudeUpsertSchema.parse({ items });
  const date = todayDate();

  await prisma.gratitudeEntry.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: { userId: user.id, date, items: clean },
    update: { items: clean },
  });

  revalidatePath(paths.dashboard.gratitude);
  revalidatePath(paths.dashboard.root);
}

// Edit a past (or any) entry: change its date and/or items. Requires at least
// 1 item, and rejects moving an entry onto a date that already has one.
export async function updateGratitude(input: {
  id: string;
  date: string;
  items: string[];
}): Promise<void> {
  const user = await requireUser();
  const { id, date, items } = gratitudeUpdateSchema.parse(input);
  const dateObj = new Date(date);

  const clash = await prisma.gratitudeEntry.findUnique({
    where: { userId_date: { userId: user.id, date: dateObj } },
    select: { id: true },
  });
  if (clash && clash.id !== id) {
    throw new Error('Đã có mục lòng biết ơn cho ngày này.');
  }

  await prisma.gratitudeEntry.update({
    where: { id, userId: user.id },
    data: { date: dateObj, items },
  });

  revalidatePath(paths.dashboard.gratitude);
  revalidatePath(paths.dashboard.root);
}

export async function deleteGratitude(id: string): Promise<void> {
  const user = await requireUser();

  await prisma.gratitudeEntry.delete({ where: { id, userId: user.id } });

  revalidatePath(paths.dashboard.gratitude);
  revalidatePath(paths.dashboard.root);
}
