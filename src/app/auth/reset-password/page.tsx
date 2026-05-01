import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { SupabaseResetPasswordView } from 'src/auth/view/supabase';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Quên mật khẩu - ${CONFIG.appName}` };

export default function Page() {
  return <SupabaseResetPasswordView />;
}
