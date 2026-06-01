import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { BibleReviewView } from 'src/sections/bible/view';

export const metadata: Metadata = { title: `Kho vũ khí - ${CONFIG.appName}` };

export default function Page() {
  return <BibleReviewView />;
}
