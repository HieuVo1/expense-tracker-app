import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DashboardOverviewView } from 'src/sections/dashboard/view';

export const metadata: Metadata = { title: `Chi tiêu - ${CONFIG.appName}` };

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  return <DashboardOverviewView searchParams={params} />;
}
