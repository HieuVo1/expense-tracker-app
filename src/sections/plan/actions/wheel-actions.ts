'use server';

import type { LifeWheelAssessment } from '@prisma/client';
import type {
  WheelScores,
  WheelSignals,
  WheelSuggestion,
  LifeWheelAssessmentDto,
} from 'src/lib/ai/wheel-types';

import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';
import { requestWheelAssessment } from 'src/lib/ai/wheel-of-life';

import { gatherSignals } from './wheel-signals';

// ----------------------------------------------------------------------

function mapToDto(row: LifeWheelAssessment): LifeWheelAssessmentDto {
  return {
    id: row.id,
    computedAt: row.computedAt.toISOString(),
    periodDays: row.periodDays,
    scores: row.scores as unknown as WheelScores,
    suggestions: row.suggestions as unknown as WheelSuggestion[],
    inputSummary: row.inputSummary as unknown as WheelSignals,
  };
}

// ----------------------------------------------------------------------

export async function getLatestAssessment(): Promise<LifeWheelAssessmentDto | null> {
  const user = await requireUser();
  const row = await prisma.lifeWheelAssessment.findFirst({
    where: { userId: user.id },
    orderBy: { computedAt: 'desc' },
  });
  return row ? mapToDto(row) : null;
}

// ----------------------------------------------------------------------

export async function listAssessmentHistory(limit = 6): Promise<LifeWheelAssessmentDto[]> {
  const user = await requireUser();
  const rows = await prisma.lifeWheelAssessment.findMany({
    where: { userId: user.id },
    orderBy: { computedAt: 'desc' },
    take: limit,
  });
  return rows.map(mapToDto);
}

// ----------------------------------------------------------------------

/**
 * Gather user signals, send to Gemini, persist result. Triggered by user
 * click — no automatic background runs.
 */
export async function runAssessment(periodDays = 30): Promise<LifeWheelAssessmentDto> {
  const user = await requireUser();
  const safePeriod = Math.min(365, Math.max(7, Math.round(periodDays)));

  const signals = await gatherSignals(user.id, safePeriod);
  const { scores, suggestions } = await requestWheelAssessment(signals);

  const row = await prisma.lifeWheelAssessment.create({
    data: {
      userId: user.id,
      periodDays: safePeriod,
      scores: scores as unknown as object,
      suggestions: suggestions as unknown as object,
      inputSummary: signals as unknown as object,
    },
  });

  // Wheel card lives on the dashboard hub.
  revalidatePath(paths.dashboard.root);
  return mapToDto(row);
}

// ----------------------------------------------------------------------

/**
 * Create a PlanTask from an AI suggestion. Lands in the user's most recent
 * active weekly plan, falling back to most recent backlog, falling back to
 * a freshly-created default backlog plan.
 */
export async function createTaskFromSuggestion(
  suggestion: WheelSuggestion,
  // Which of suggestion.recommendedTasks the user picked; falls back to the
  // legacy single title, then to the message.
  taskTitle?: string
): Promise<{ planId: string; taskId: string }> {
  const user = await requireUser();

  let target = await prisma.plan.findFirst({
    where: { userId: user.id, scope: 'weekly', status: 'active' },
    orderBy: { startDate: 'desc' },
  });

  if (!target) {
    target = await prisma.plan.findFirst({
      where: { userId: user.id, scope: 'backlog', status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!target) {
    target = await prisma.plan.create({
      data: {
        userId: user.id,
        scope: 'backlog',
        title: 'Backlog mặc định',
        status: 'active',
        startDate: null,
        endDate: null,
      },
    });
  }

  const maxOrder = await prisma.planTask.aggregate({
    where: { planId: target.id, priority: 'schedule' },
    _max: { order: true },
  });

  const title =
    taskTitle?.trim() ||
    suggestion.recommendedTasks?.[0] ||
    suggestion.recommendedTaskTitle ||
    suggestion.message.slice(0, 80);

  const created = await prisma.planTask.create({
    data: {
      planId: target.id,
      title,
      priority: 'schedule',
      lifeArea: suggestion.area,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  revalidatePath(paths.dashboard.planDetail(target.id));
  revalidatePath(paths.dashboard.plans);

  return { planId: target.id, taskId: created.id };
}
