import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import { CONFIG } from 'src/global-config';

// Server client — used in Server Components, Route Handlers, Server Actions.
// Reads and writes auth cookies via Next's cookies() helper so SSR sees the
// authenticated user without a round-trip to the browser.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(CONFIG.supabase.url, CONFIG.supabase.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll called from a Server Component — ignored. Middleware refreshes
          // the session, so this is safe.
        }
      },
    },
  });
}
