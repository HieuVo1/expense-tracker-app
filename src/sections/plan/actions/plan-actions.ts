'use server';

import type { PlanStatus } from '@prisma/client';
import type { PlanFormValues } from '../schemas';
import type { PlanRow, PlanDetail } from '../types';

import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

import { planFormSchema } from '../schemas';
import { nextRange, isPlanCurrent } from '../utils/plan-dates';

// ----------------------------------------------------------------------

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ----------------------------------------------------------------------

export async function listPlans(): Promise<PlanRow[]> {
  const user = await requireUser();

  const [plans, doneCounts] = await Promise.all([
    prisma.plan.findMany({
      where: { userId: user.id },
      include: { _count: { select: { tasks: true } } },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.planTask.groupBy({
      by: ['planId'],
      where: { plan: { userId: user.id }, isDone: true },
      _count: true,
    }),
  ]);

  const doneMap = new Map(doneCounts.map((d) => [d.planId, d._count]));

  const rows: PlanRow[] = plans.map((p) => {
    const totalCount = p._count.tasks;
    const doneCount = doneMap.get(p.id) ?? 0;
    const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    const startDate = toDateString(p.startDate);
    const endDate = toDateString(p.endDate);
    const status = p.status;

    return {
      id: p.id,
      scope: p.scope,
      title: p.title,
      description: p.description,
      startDate,
      endDate,
      status,
      doneCount,
      totalCount,
      progress,
      isCurrent: isPlanCurrent({ startDate, endDate, status }),
      createdAt: p.createdAt.toISOString(),
    };
  });

  // Sort: current first, then by startDate desc (already ordered from DB for the rest)
  rows.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return b.startDate.localeCompare(a.startDate);
  });

  return rows;
}

// ----------------------------------------------------------------------

export async function createPlan(
  input: PlanFormValues
): Promise<{ id: string }> {
  const user = await requireUser();
  const data = planFormSchema.parse(input);

  const plan = await prisma.plan.create({
    data: {
      userId: user.id,
      scope: data.scope,
      title: data.title,
      description: data.description?.trim() || null,
      // Prisma @db.Date stores date-only; new Date('YYYY-MM-DD') parses as UTC midnight
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: 'active',
    },
    select: { id: true },
  });

  revalidatePath(paths.dashboard.plans);
  return { id: plan.id };
}

// ----------------------------------------------------------------------

export async function getPlan(id: string): Promise<PlanDetail | null> {
  const user = await requireUser();

  const plan = await prisma.plan.findFirst({
    where: { id, userId: user.id },
    include: {
      tasks: {
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!plan) return null;

  const totalCount = plan.tasks.length;
  const doneCount = plan.tasks.filter((t) => t.isDone).length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const startDate = toDateString(plan.startDate);
  const endDate = toDateString(plan.endDate);

  return {
    id: plan.id,
    scope: plan.scope,
    title: plan.title,
    description: plan.description,
    startDate,
    endDate,
    status: plan.status,
    doneCount,
    totalCount,
    progress,
    isCurrent: isPlanCurrent({ startDate, endDate, status: plan.status }),
    createdAt: plan.createdAt.toISOString(),
    tasks: plan.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      isDone: t.isDone,
      priority: t.priority,
      dueDate: t.dueDate ? toDateString(t.dueDate) : null,
      order: t.order,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}

// ----------------------------------------------------------------------

export async function updatePlan(id: string, input: PlanFormValues): Promise<void> {
  const user = await requireUser();
  const data = planFormSchema.parse(input);

  const existing = await prisma.plan.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error('NOT_FOUND');

  await prisma.plan.update({
    where: { id },
    data: {
      scope: data.scope,
      title: data.title,
      description: data.description?.trim() || null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
  });

  revalidatePath(paths.dashboard.planDetail(id));
  revalidatePath(paths.dashboard.plans);
}

// ----------------------------------------------------------------------

export async function deletePlan(id: string): Promise<void> {
  const user = await requireUser();

  const existing = await prisma.plan.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error('NOT_FOUND');

  await prisma.plan.delete({ where: { id } });

  revalidatePath(paths.dashboard.plans);
}

// ----------------------------------------------------------------------

export async function setPlanStatus(id: string, status: PlanStatus): Promise<void> {
  const user = await requireUser();

  const existing = await prisma.plan.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error('NOT_FOUND');

  await prisma.plan.update({ where: { id }, data: { status } });

  revalidatePath(paths.dashboard.planDetail(id));
  revalidatePath(paths.dashboard.plans);
}

// ----------------------------------------------------------------------

/**
 * Creates a new plan in the next period (week/month after the source plan's
 * endDate) and copies over only INCOMPLETE tasks. Source plan keeps its
 * status — user manually marks completed/archived after reviewing.
 *
 * Returns the new plan id.
 */
export async function rolloverPlan(id: string): Promise<{ id: string }> {
  const user = await requireUser();

  const source = await prisma.plan.findFirst({
    where: { id, userId: user.id },
    include: {
      tasks: {
        where: { isDone: false },
        orderBy: [{ priority: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });
  if (!source) throw new Error('NOT_FOUND');

  const sourceEnd = source.endDate.toISOString().slice(0, 10);
  const range = nextRange(source.scope, sourceEnd);

  const newPlan = await prisma.$transaction(async (tx) => {
    const created = await tx.plan.create({
      data: {
        userId: user.id,
        scope: source.scope,
        title: source.title,
        description: source.description,
        startDate: new Date(range.startDate),
        endDate: new Date(range.endDate),
        status: 'active',
      },
    });

    if (source.tasks.length > 0) {
      await tx.planTask.createMany({
        data: source.tasks.map((t, idx) => ({
          planId: created.id,
          title: t.title,
          priority: t.priority,
          isDone: false,
          dueDate: t.dueDate,
          order: idx, // re-sequence; preserves the priority+order ordering
        })),
      });
    }

    return created;
  });

  revalidatePath(paths.dashboard.plans);
  revalidatePath(paths.dashboard.planDetail(id));
  revalidatePath(paths.dashboard.planDetail(newPlan.id));

  return { id: newPlan.id };
}
