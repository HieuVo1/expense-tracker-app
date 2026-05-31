import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { BibleThemeDetailView } from 'src/sections/bible/view';

export const metadata: Metadata = { title: `Chủ đề - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <BibleThemeDetailView themeId={id} />;
}
