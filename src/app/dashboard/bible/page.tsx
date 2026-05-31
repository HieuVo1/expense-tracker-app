import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { BibleHubView } from 'src/sections/bible/view';

export const metadata: Metadata = { title: `Học tập - ${CONFIG.appName}` };

export default function Page() {
  return <BibleHubView />;
}
