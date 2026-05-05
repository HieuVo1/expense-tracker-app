import { notFound } from 'next/navigation';

import { DashboardContent } from 'src/layouts/dashboard';

import { getPlan } from '../actions/plan-actions';
import { PlanTasksPanel } from '../components/plan-tasks-panel';
import { PlanDetailHeader } from '../components/plan-detail-header';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export async function PlanDetailView({ id }: Props) {
  const plan = await getPlan(id);

  if (!plan) notFound();

  return (
    <DashboardContent>
      <PlanDetailHeader plan={plan} />
      <PlanTasksPanel planId={plan.id} tasks={plan.tasks} />
    </DashboardContent>
  );
}
