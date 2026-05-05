import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { PlanListView } from 'src/sections/plan/view';

export const metadata: Metadata = { title: `Kế hoạch - ${CONFIG.appName}` };

export default function Page() {
  return <PlanListView />;
}
