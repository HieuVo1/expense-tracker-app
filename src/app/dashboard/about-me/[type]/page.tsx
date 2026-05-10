import type { Metadata } from 'next';
import type { AboutMeType } from 'src/sections/about-me/types';

import { notFound } from 'next/navigation';

import { CONFIG } from 'src/global-config';

import { AboutMeListView } from 'src/sections/about-me/view/about-me-list-view';
import { ABOUT_ME_TYPE_VALUES, ABOUT_ME_TYPE_LABELS } from 'src/sections/about-me/constants/about-me-types';

// ----------------------------------------------------------------------

type Props = { params: Promise<{ type: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const upper = type.toUpperCase() as AboutMeType;
  const label = ABOUT_ME_TYPE_LABELS[upper] ?? 'Về tôi';
  return { title: `${label} - ${CONFIG.appName}` };
}

export default async function Page({ params }: Props) {
  const { type } = await params;
  const upper = type.toUpperCase();

  if (!ABOUT_ME_TYPE_VALUES.includes(upper as AboutMeType)) {
    notFound();
  }

  return <AboutMeListView type={upper as AboutMeType} />;
}
