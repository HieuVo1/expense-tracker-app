import { DashboardContent } from 'src/layouts/dashboard';

import { listPlans } from '../actions/plan-actions';
import { PlanListClient } from './plan-list-client';

// Server component — fetches all user plans, delegates interaction to client.
export async function PlanListView() {
  const plans = await listPlans();

  return (
    <DashboardContent>
      <PlanListClient initial={plans} />
    </DashboardContent>
  );
}
