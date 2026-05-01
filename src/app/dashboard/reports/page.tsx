import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ReportView } from 'src/sections/report/view';

export const metadata: Metadata = { title: `Báo cáo - ${CONFIG.appName}` };

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  return <ReportView searchParams={params} />;
}
