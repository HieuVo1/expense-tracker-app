import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

import { createClient } from './supabase/server';

// Server-side helper: returns the authenticated user or redirects to /auth/sign-in.
// Use in Server Components, Route Handlers, and Server Actions that require auth.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(paths.auth.signIn);
  }

  return user;
}

// Returns the user or null without redirecting — for optional-auth contexts.
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}
