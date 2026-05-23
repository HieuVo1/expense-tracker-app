'use server';

import type { GratitudeEntryRow } from '../types';

import dayjs from 'dayjs';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

import { gratitudeUpsertSchema } from '../schemas';
import { GRATITUDE_MIN_ITEMS } from '../constants/gratitude';

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

// Upsert today's entry. Hard min of GRATITUDE_MIN_ITEMS enforced via Zod.
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

// Lightweight check for the dashboard reminder: is today's practice complete?
export async function isGratitudeDoneToday(): Promise<boolean> {
  const user = await requireUser();

  const row = await prisma.gratitudeEntry.findUnique({
    where: { userId_date: { userId: user.id, date: todayDate() } },
    select: { items: true },
  });

  return (row?.items.length ?? 0) >= GRATITUDE_MIN_ITEMS;
}
