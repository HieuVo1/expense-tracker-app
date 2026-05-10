import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { NoteListView } from 'src/sections/note/view';

export const metadata: Metadata = { title: `Nhật ký - ${CONFIG.appName}` };

export default function Page() {
  return <NoteListView />;
}
