'use server';

import type { PlanStatus } from '@prisma/client';
import type { PlanFormValues } from '../schemas';
import type { PlanRow, PlanDetail, PlanMoveTarget } from '../types';

import dayjs from 'dayjs';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

import { planFormSchema } from '../schemas';
import { nextRange, isPlanCurrent, withDateRangeInTitle } from '../utils/plan-dates';

// ----------------------------------------------------------------------

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Form schema accepts any dayjs-parseable date; narrow to date-only UTC
// midnight here so Prisma @db.Date persists what the user picked.
function toDateOnlyUtc(input: string): Date {
  return new Date(`${dayjs(input).format('YYYY-MM-DD')}T00:00:00.000Z`);
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
    const startDate = p.startDate ? toDateString(p.startDate) : null;
    const endDate = p.endDate ? toDateString(p.endDate) : null;
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
      isCurrent: isPlanCurrent({ scope: p.scope, startDate, endDate, status }),
      createdAt: p.createdAt.toISOString(),
    };
  });

  // Sort: current first; then non-backlog by startDate desc; backlog by createdAt desc.
  rows.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    if (a.scope === 'backlog' && b.scope !== 'backlog') return 1;
    if (a.scope !== 'backlog' && b.scope === 'backlog') return -1;
    if (a.scope === 'backlog' && b.scope === 'backlog') {
      return b.createdAt.localeCompare(a.createdAt);
    }
    // Both non-backlog: startDate is guaranteed non-null here.
    return (b.startDate ?? '').localeCompare(a.startDate ?? '');
  });

  return rows;
}

// ----------------------------------------------------------------------

export async function createPlan(input: PlanFormValues): Promise<{ id: string }> {
  const user = await requireUser();
  const data = planFormSchema.parse(input);
  const isBacklog = data.scope === 'backlog';

  const plan = await prisma.plan.create({
    data: {
      userId: user.id,
      scope: data.scope,
      title: isBacklog
        ? data.title
        : withDateRangeInTitle(data.title, data.startDate!, data.endDate!),
      description: data.description?.trim() || null,
      startDate: isBacklog ? null : toDateOnlyUtc(data.startDate!),
      endDate: isBacklog ? null : toDateOnlyUtc(data.endDate!),
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
  const startDate = plan.startDate ? toDateString(plan.startDate) : null;
  const endDate = plan.endDate ? toDateString(plan.endDate) : null;

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
    isCurrent: isPlanCurrent({ scope: plan.scope, startDate, endDate, status: plan.status }),
    createdAt: plan.createdAt.toISOString(),
    tasks: plan.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      isDone: t.isDone,
      priority: t.priority,
      lifeArea: t.lifeArea,
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
  const isBacklog = data.scope === 'backlog';

  const existing = await prisma.plan.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error('NOT_FOUND');

  await prisma.plan.update({
    where: { id },
    data: {
      scope: data.scope,
      title: isBacklog
        ? withDateRangeInTitle(data.title, null, null)
        : withDateRangeInTitle(data.title, data.startDate!, data.endDate!),
      description: data.description?.trim() || null,
      startDate: isBacklog ? null : toDateOnlyUtc(data.startDate!),
      endDate: isBacklog ? null : toDateOnlyUtc(data.endDate!),
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
 * Creates a new plan in the next period (week/month/year after the source
 * plan's endDate) and copies over only INCOMPLETE tasks. Backlog cannot be
 * rolled over (no period). Source plan keeps its status — user manually marks
 * completed/archived after reviewing.
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
  if (source.scope === 'backlog') throw new Error('ROLLOVER_NOT_SUPPORTED');
  if (!source.endDate) throw new Error('ROLLOVER_NOT_SUPPORTED');

  const sourceEnd = source.endDate.toISOString().slice(0, 10);
  const range = nextRange(source.scope, sourceEnd);

  const newPlan = await prisma.$transaction(async (tx) => {
    const created = await tx.plan.create({
      data: {
        userId: user.id,
        scope: source.scope,
        title: withDateRangeInTitle(source.title, range.startDate, range.endDate),
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
          lifeArea: t.lifeArea,
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

// ----------------------------------------------------------------------

/**
 * Returns active non-backlog plans the user could move a task into.
 * Excludes `excludePlanId` (typically the current plan).
 */
export async function listMoveTargets(excludePlanId: string): Promise<PlanMoveTarget[]> {
  const user = await requireUser();

  const targets = await prisma.plan.findMany({
    where: {
      userId: user.id,
      status: 'active',
      scope: { not: 'backlog' },
      id: { not: excludePlanId },
    },
    select: { id: true, scope: true, title: true, startDate: true },
    orderBy: [{ scope: 'asc' }, { startDate: 'desc' }],
  });

  return targets.map((t) => ({ id: t.id, scope: t.scope, title: t.title }));
}
