import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AboutMeHubView } from 'src/sections/about-me/view';

export const metadata: Metadata = { title: `Về tôi - ${CONFIG.appName}` };

export default function Page() {
  return <AboutMeHubView />;
}
