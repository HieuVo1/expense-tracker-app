import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { BibleThemesView } from 'src/sections/bible/view';

export const metadata: Metadata = { title: `Chủ đề Học tập - ${CONFIG.appName}` };

export default function Page() {
  return <BibleThemesView />;
}
