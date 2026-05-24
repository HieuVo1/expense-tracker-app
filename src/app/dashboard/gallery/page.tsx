import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { GalleryView } from 'src/sections/gallery/view';

export const metadata: Metadata = { title: `Thư viện ảnh - ${CONFIG.appName}` };

export default function Page() {
  return <GalleryView />;
}
