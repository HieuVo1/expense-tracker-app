import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { NoteListView } from 'src/sections/note/view';

export const metadata: Metadata = { title: `Ghi chú - ${CONFIG.appName}` };

export default function Page() {
  return <NoteListView />;
}
