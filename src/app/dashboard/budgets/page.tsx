import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { BudgetListView } from 'src/sections/budget/view';

export const metadata: Metadata = { title: `Ngân sách - ${CONFIG.appName}` };

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  return <BudgetListView searchParams={params} />;
}
