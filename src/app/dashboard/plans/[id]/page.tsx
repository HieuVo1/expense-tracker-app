import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { PlanDetailView } from 'src/sections/plan/view';

export const metadata: Metadata = { title: `Chi tiết kế hoạch - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <PlanDetailView id={id} />;
}
