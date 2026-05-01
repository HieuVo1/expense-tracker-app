import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { TransactionListView } from 'src/sections/transaction/view';

export const metadata: Metadata = { title: `Giao dịch - ${CONFIG.appName}` };

type Props = {
  searchParams: Promise<{ type?: string; categoryId?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  return <TransactionListView searchParams={params} />;
}
