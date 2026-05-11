import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DashboardHubView } from 'src/sections/dashboard/view';

export const metadata: Metadata = { title: `Tổng quan - ${CONFIG.appName}` };

export default async function Page() {
  return <DashboardHubView />;
}
