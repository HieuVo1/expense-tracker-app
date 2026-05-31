import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { BibleReviewView } from 'src/sections/bible/view';

export const metadata: Metadata = { title: `Ôn tập - ${CONFIG.appName}` };

export default function Page() {
  return <BibleReviewView />;
}
