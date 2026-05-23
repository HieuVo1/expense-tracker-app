import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { GratitudeView } from 'src/sections/gratitude/view';

export const metadata: Metadata = { title: `Lòng biết ơn - ${CONFIG.appName}` };

export default function Page() {
  return <GratitudeView />;
}
