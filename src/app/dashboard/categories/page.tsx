import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { CategoryListView } from 'src/sections/category/view';

export const metadata: Metadata = { title: `Danh mục - ${CONFIG.appName}` };

export default function Page() {
  return <CategoryListView />;
}
