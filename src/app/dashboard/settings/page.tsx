import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { SettingsView } from 'src/sections/settings/view';

export const metadata: Metadata = { title: `Cài đặt - ${CONFIG.appName}` };

export default function Page() {
  return <SettingsView />;
}
