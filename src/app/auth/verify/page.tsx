import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { SupabaseVerifyView } from 'src/auth/view/supabase';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Xác nhận email - ${CONFIG.appName}` };

export default function Page() {
  return <SupabaseVerifyView />;
}
