-- Remove the Bible Study Tracker feature.
-- Drops all six bible_* tables (and their RLS policies via CASCADE).
-- Child/join tables are covered by CASCADE on the parents, but we drop
-- explicitly + IF EXISTS to stay idempotent across environments.

-- DropTable
DROP TABLE IF EXISTS "bible_lesson_verses" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "bible_verse_themes" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "bible_review_states" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "bible_themes" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "bible_lessons" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "bible_verses" CASCADE;
