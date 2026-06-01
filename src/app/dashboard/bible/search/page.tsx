import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { BibleSearchView } from 'src/sections/bible/view';

export const metadata: Metadata = { title: `Tìm kiếm - ${CONFIG.appName}` };

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const { q } = await searchParams;
  return <BibleSearchView q={q ?? ''} />;
}
