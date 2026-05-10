-- consolidate_notes_to_journal_only
--
-- The Notes module originally had 5 lowercase types. The About-me module
-- (added later) covers 4 of them via UPPERCASE equivalents. This migration:
--   1. Moves old-type rows into their About-me equivalents.
--   2. Drops the 4 obsolete enum values from NoteType.
--
-- UPDATE statements MUST run before the enum is recreated, otherwise Postgres
-- would reject the column ALTER because old values would still exist in rows.

-- 1. insight → LESSON (reflection subtype — set metadata accordingly)
UPDATE "notes"
SET type = 'LESSON',
    metadata = jsonb_build_object('source', 'reflection')
WHERE type = 'insight';

-- 2. strength → TRAIT with metadata {kind: 'strength'}
UPDATE "notes"
SET type = 'TRAIT',
    metadata = jsonb_build_object('kind', 'strength')
WHERE type = 'strength';

-- 3. weakness → TRAIT with metadata {kind: 'weakness'}
UPDATE "notes"
SET type = 'TRAIT',
    metadata = jsonb_build_object('kind', 'weakness')
WHERE type = 'weakness';

-- 4. idea → THOUGHT (metadata optional — set to null; THOUGHT content stands alone)
UPDATE "notes"
SET type = 'THOUGHT',
    metadata = NULL
WHERE type = 'idea';

-- 5. Drop the 4 obsolete enum values.
--    Postgres requires recreating the type; old type is renamed then dropped.
ALTER TYPE "NoteType" RENAME TO "NoteType_old";

CREATE TYPE "NoteType" AS ENUM (
  'daily',
  'GOAL',
  'THOUGHT',
  'LESSON',
  'SIGNAL',
  'PRINCIPLE',
  'TRAIT',
  'ACTION'
);

ALTER TABLE "notes"
  ALTER COLUMN "type" TYPE "NoteType"
  USING "type"::text::"NoteType";

DROP TYPE "NoteType_old";
