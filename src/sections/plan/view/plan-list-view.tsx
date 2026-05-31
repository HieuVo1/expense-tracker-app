import { DashboardContent } from 'src/layouts/dashboard';

import { PlanListClient } from './plan-list-client';
import { listPlans, getWeekSchedulingContext } from '../actions/plan-actions';

// Server component — fetches all user plans + current ISO-week scheduling
// context (all undone tasks from active plans across scopes).
export async function PlanListView() {
  const [plans, weekContext] = await Promise.all([
    listPlans(),
    getWeekSchedulingContext(),
  ]);

  return (
    <DashboardContent>
      <PlanListClient initial={plans} weekContext={weekContext} />
    </DashboardContent>
  );
}
