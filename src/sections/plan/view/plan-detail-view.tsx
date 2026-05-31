import { notFound } from 'next/navigation';

import { DashboardContent } from 'src/layouts/dashboard';

import { PlanTasksPanel } from '../components/plan-tasks-panel';
import { getPlan, listMoveTargets } from '../actions/plan-actions';
import { PlanDetailHeader } from '../components/plan-detail-header';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export async function PlanDetailView({ id }: Props) {
  const plan = await getPlan(id);

  if (!plan) notFound();

  // Fetch move targets in parallel with plan rendering (cheap aggregate query).
  const moveTargets = await listMoveTargets(plan.id);

  return (
    <DashboardContent>
      <PlanDetailHeader plan={plan} />
      <PlanTasksPanel planId={plan.id} tasks={plan.tasks} moveTargets={moveTargets} />
    </DashboardContent>
  );
}
