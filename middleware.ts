import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { paths } from 'src/routes/paths';
import { updateSession } from 'src/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';
import { CONFIG } from 'src/global-config';

// Routes that require authentication. Anything matching is redirected to /auth/sign-in.
const PROTECTED_PREFIXES = ['/dashboard'];

// Routes that require the visitor to be logged out (sign-in, sign-up, etc.).
const GUEST_ONLY_PREFIXES = ['/auth/sign-in', '/auth/sign-up'];

export async function middleware(request: NextRequest) {
  // 1. Refresh the session cookie if needed (rotates expired access tokens).
  const sessionResponse = await updateSession(request);

  // 2. Read user — re-using the same cookies the helper just touched.
  const supabase = createServerClient(CONFIG.supabase.url, CONFIG.supabase.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {
        // Read-only here; updateSession already wrote refreshed cookies.
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 3. Route protection logic.
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isGuestOnly = GUEST_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = paths.auth.signIn;
    return NextResponse.redirect(url);
  }

  if (isGuestOnly && user) {
    const url = request.nextUrl.clone();
    url.pathname = paths.dashboard.root;
    return NextResponse.redirect(url);
  }

  return sessionResponse;
}

// Skip middleware for static assets, image optimisation, and favicon to keep
// edge invocations cheap on Vercel free tier.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/|logo/).*)'],
};
