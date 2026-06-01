import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { BibleReviewView } from 'src/sections/bible/view';

export const metadata: Metadata = { title: `Kho vũ khí - ${CONFIG.appName}` };

type Props = {
  searchParams: Promise<{ mode?: string; themeId?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams;
  const mode = sp.mode === 'sm2' ? 'sm2' : 'challenge';
  const themeId = sp.themeId ?? null;
  return <BibleReviewView mode={mode} themeId={themeId} />;
}
