// Server-only helpers for the private `note-images` Storage bucket. Imported by
// server actions ('use server'). Uses the authenticated server Supabase client,
// so owner-only RLS lets each user sign / delete their own files.

import { createClient } from 'src/lib/supabase/server';

import { NOTE_IMAGES_BUCKET, NOTE_IMAGE_SIGNED_TTL } from './note-images';

// Batch-sign Storage paths → display URLs (path → signed URL).
export async function signNoteImages(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = Array.from(new Set(paths.filter((p) => p.length > 0)));
  if (unique.length === 0) return map;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(NOTE_IMAGES_BUCKET)
    .createSignedUrls(unique, NOTE_IMAGE_SIGNED_TTL);
  if (error || !data) return map;

  for (const item of data) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  }
  return map;
}

// Best-effort delete of orphaned files. Never throws — cleanup failure must not
// block the surrounding write (the DB row is the source of truth).
export async function deleteNoteImages(paths: string[]): Promise<void> {
  const clean = Array.from(new Set(paths.filter((p) => p.length > 0)));
  if (clean.length === 0) return;
  try {
    const supabase = await createClient();
    await supabase.storage.from(NOTE_IMAGES_BUCKET).remove(clean);
  } catch {
    // ignore — orphan cleanup is non-critical
  }
}
