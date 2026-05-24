// Shared constants for the private "note-images" Supabase Storage bucket.
// Safe to import from both client and server (no runtime deps).

export const NOTE_IMAGES_BUCKET = 'note-images';

// Signed-URL lifetime for displaying private images (seconds). Long enough to
// cover a working session; reads re-sign on navigation / revalidation.
export const NOTE_IMAGE_SIGNED_TTL = 60 * 60 * 8; // 8 hours

// Per-note attachment limits.
export const NOTE_IMAGE_MAX = 12;
export const NOTE_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
