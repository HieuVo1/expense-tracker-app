import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { BudgetListView } from 'src/sections/budget/view';

export const metadata: Metadata = { title: `Ngân sách - ${CONFIG.appName}` };

export default function Page() {
  return <BudgetListView />;
}
