-- Note: attached image storage paths (About-me entries). Stored as bucket-
-- relative paths like "<uid>/<uuid>.<ext>"; signed URLs are generated on read.
ALTER TABLE "notes" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- PRIVATE Storage bucket for About-me note images — only the owner can read.
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-images', 'note-images', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- RLS on storage.objects: authenticated users may read/write ONLY inside their
-- own folder (object name prefixed with their uid: "<uid>/<file>"). The SELECT
-- policy is required so the owner can mint signed URLs for their own files.
DROP POLICY IF EXISTS "note_images_select_own" ON storage.objects;
CREATE POLICY "note_images_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'note-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "note_images_insert_own" ON storage.objects;
CREATE POLICY "note_images_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'note-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "note_images_update_own" ON storage.objects;
CREATE POLICY "note_images_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'note-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "note_images_delete_own" ON storage.objects;
CREATE POLICY "note_images_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'note-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
