import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { BibleLessonDetailView } from 'src/sections/bible/view';

export const metadata: Metadata = { title: `Bài học - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <BibleLessonDetailView lessonId={id} />;
}
