import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { SubscriptionListView } from 'src/sections/subscription/view';

export const metadata: Metadata = { title: `Hoá đơn định kỳ - ${CONFIG.appName}` };

export default function Page() {
  return <SubscriptionListView />;
}
