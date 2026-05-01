import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { TransactionAddView } from 'src/sections/transaction/view';

export const metadata: Metadata = { title: `Thêm giao dịch - ${CONFIG.appName}` };

export default function Page() {
  return <TransactionAddView />;
}
