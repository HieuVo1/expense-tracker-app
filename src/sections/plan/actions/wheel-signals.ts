'use server';

import type { LifeArea } from '@prisma/client';
import type { WheelSignals } from 'src/lib/ai/wheel-types';

import dayjs from 'dayjs';

import { prisma } from 'src/lib/prisma';

import { countLifeAreaKeywords, categoryNameToLifeArea } from './wheel-text-signals';

// ----------------------------------------------------------------------
// Collects compact, aggregated signals for the user across the period.
// Per-row payloads stay on the server; only counts + a few sample strings
// are returned for AI consumption.

const AREA_KEYS: LifeArea[] = [
  'HEALTH',
  'CAREER',
  'FINANCE',
  'GROWTH',
  'FAMILY',
  'SOCIAL',
  'RECREATION',
  'SPIRITUALITY',
];

function pruneZeroAreas(hits: Record<LifeArea, number>): Partial<Record<LifeArea, number>> {
  const out: Partial<Record<LifeArea, number>> = {};
  for (const k of AREA_KEYS) if (hits[k] > 0) out[k] = hits[k];
  return out;
}

export async function gatherSignals(userId: string, periodDays: number): Promise<WheelSignals> {
  const since = dayjs().subtract(periodDays, 'day').toDate();

  const [
    tasksTotal,
    tasksDone,
    notesByType,
    notesContent,
    gratitudeEntries,
    txIncome,
    txExpense,
    txExpenseRows,
    assets,
    aboutMeTotals,
  ] = await Promise.all([
    prisma.planTask.groupBy({
      by: ['lifeArea'],
      where: { plan: { userId }, createdAt: { gte: since }, NOT: { lifeArea: null } },
      _count: { _all: true },
    }),
    prisma.planTask.groupBy({
      by: ['lifeArea'],
      where: {
        plan: { userId },
        createdAt: { gte: since },
        isDone: true,
        NOT: { lifeArea: null },
      },
      _count: { _all: true },
    }),
    prisma.note.groupBy({
      by: ['type'],
      where: { userId, updatedAt: { gte: since } },
      _count: { _all: true },
    }),
    // Daily journal + about-me content for keyword mining. Cap at 50 most
    // recent + truncate each to 600 chars to bound work.
    prisma.note.findMany({
      where: { userId, updatedAt: { gte: since } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: { type: true, title: true, content: true, tags: true },
    }),
    prisma.gratitudeEntry.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: 'desc' },
      take: 30,
      select: { items: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'income', date: { gte: since } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'expense', date: { gte: since } },
      _sum: { amount: true },
    }),
    // Per-row expense data so we can both top-N by category AND
    // keyword-mine the description text + map category → life area.
    prisma.transaction.findMany({
      where: { userId, type: 'expense', date: { gte: since } },
      select: {
        amount: true,
        description: true,
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.asset.aggregate({
      where: { userId },
      _sum: { currentValue: true },
    }),
    prisma.note.groupBy({
      by: ['type'],
      where: {
        userId,
        type: { in: ['GOAL', 'LESSON', 'PRINCIPLE'] },
        updatedAt: { gte: since },
      },
      _count: { _all: true },
    }),
  ]);

  // ---- tasksByArea: merge total + done counts
  const tasksByArea: WheelSignals['tasksByArea'] = {};
  for (const row of tasksTotal) {
    if (!row.lifeArea) continue;
    tasksByArea[row.lifeArea as LifeArea] = { total: row._count._all, done: 0 };
  }
  for (const row of tasksDone) {
    if (!row.lifeArea) continue;
    const key = row.lifeArea as LifeArea;
    if (tasksByArea[key]) tasksByArea[key]!.done = row._count._all;
    else tasksByArea[key] = { total: row._count._all, done: row._count._all };
  }

  // ---- notesByType + sample titles per type
  const samplesByType: Record<string, string[]> = {};
  for (const n of notesContent) {
    if (!samplesByType[n.type]) samplesByType[n.type] = [];
    if (samplesByType[n.type].length < 3) {
      samplesByType[n.type].push(n.title.slice(0, 80));
    }
  }
  const notesByTypeFinal: WheelSignals['notesByType'] = {};
  for (const row of notesByType) {
    notesByTypeFinal[row.type] = {
      count: row._count._all,
      recentTitles: samplesByType[row.type] ?? [],
    };
  }

  // ---- gratitude samples (flatten + cap)
  const gratitudeSamples: string[] = [];
  for (const entry of gratitudeEntries) {
    for (const item of entry.items.slice(0, 2)) {
      if (gratitudeSamples.length < 5) gratitudeSamples.push(item.slice(0, 100));
    }
  }
  const gratitudeStats = {
    entryCount: gratitudeEntries.length,
    sampleItems: gratitudeSamples,
  };

  // ---- top expense categories + expenseByLifeArea
  const expenseSumByCategory = new Map<string, { name: string; sum: number }>();
  for (const tx of txExpenseRows) {
    const id = tx.category.id;
    const cur = expenseSumByCategory.get(id);
    if (cur) cur.sum += Number(tx.amount);
    else expenseSumByCategory.set(id, { name: tx.category.name, sum: Number(tx.amount) });
  }
  const topExpenseCategories = Array.from(expenseSumByCategory.values())
    .sort((a, b) => b.sum - a.sum)
    .slice(0, 5);

  const expenseByLifeArea: Partial<Record<LifeArea, number>> = {};
  for (const { name, sum } of expenseSumByCategory.values()) {
    const area = categoryNameToLifeArea(name);
    if (area) expenseByLifeArea[area] = (expenseByLifeArea[area] ?? 0) + sum;
  }

  const txStats: WheelSignals['txStats'] = {
    income: Number(txIncome._sum.amount ?? 0),
    expense: Number(txExpense._sum.amount ?? 0),
    topExpenseCategories,
    expenseByLifeArea,
  };

  // ---- aboutMe counts
  const aboutMeMap: Record<string, number> = {};
  for (const row of aboutMeTotals) aboutMeMap[row.type] = row._count._all;
  const aboutMeStats = {
    goals: aboutMeMap.GOAL ?? 0,
    lessons: aboutMeMap.LESSON ?? 0,
    principles: aboutMeMap.PRINCIPLE ?? 0,
  };

  // ---- textMentions: keyword mining for HEALTH / FAMILY / SOCIAL / RECREATION
  // (and others) when tasks are untagged.
  const noteTexts: string[] = [];
  for (const n of notesContent) {
    noteTexts.push(n.title);
    noteTexts.push(n.content.slice(0, 600));
    if (n.tags?.length) noteTexts.push(n.tags.join(' '));
  }
  const gratitudeTexts: string[] = [];
  for (const entry of gratitudeEntries) {
    for (const item of entry.items) gratitudeTexts.push(item.slice(0, 200));
  }
  const txTexts: string[] = [];
  for (const tx of txExpenseRows) {
    if (tx.description) txTexts.push(tx.description.slice(0, 100));
    txTexts.push(tx.category.name);
  }

  const textMentions: WheelSignals['textMentions'] = {
    noteHits: pruneZeroAreas(countLifeAreaKeywords(noteTexts)),
    gratitudeHits: pruneZeroAreas(countLifeAreaKeywords(gratitudeTexts)),
    transactionHits: pruneZeroAreas(countLifeAreaKeywords(txTexts)),
  };

  return {
    periodDays,
    tasksByArea,
    notesByType: notesByTypeFinal,
    gratitudeStats,
    txStats,
    assetSnapshot: { netWorth: Number(assets._sum.currentValue ?? 0) },
    aboutMeStats,
    textMentions,
  };
}
