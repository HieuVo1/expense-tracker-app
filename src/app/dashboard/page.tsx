import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DashboardOverviewView } from 'src/sections/dashboard/view';

export const metadata: Metadata = { title: `Tổng quan - ${CONFIG.appName}` };

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  return <DashboardOverviewView searchParams={params} />;
}
