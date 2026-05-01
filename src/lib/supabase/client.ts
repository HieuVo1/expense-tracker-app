'use client';

import { createBrowserClient } from '@supabase/ssr';

import { CONFIG } from 'src/global-config';

// Browser client — used in Client Components, hooks, browser-side actions.
// Cookies are read/written via the browser's document.cookie automatically.
export function createClient() {
  return createBrowserClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
}
