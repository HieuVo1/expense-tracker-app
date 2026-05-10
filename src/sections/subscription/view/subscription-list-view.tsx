import { DashboardContent } from 'src/layouts/dashboard';

import { listSubscriptions } from '../actions/subscription-actions';
import { SubscriptionListClient } from './subscription-list-client';

export async function SubscriptionListView() {
  const rows = await listSubscriptions();

  return (
    <DashboardContent>
      <SubscriptionListClient initial={rows} />
    </DashboardContent>
  );
}
