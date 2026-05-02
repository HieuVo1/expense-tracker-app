import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AssetListView } from 'src/sections/asset/view';

export const metadata: Metadata = { title: `Tài sản - ${CONFIG.appName}` };

export default function Page() {
  return <AssetListView />;
}
