import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AboutMeCompanionView } from 'src/sections/about-me/view';

export const metadata: Metadata = { title: `Tâm sự - ${CONFIG.appName}` };

export default function Page() {
  return <AboutMeCompanionView />;
}
