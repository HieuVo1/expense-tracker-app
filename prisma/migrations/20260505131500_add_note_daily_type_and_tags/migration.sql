-- AlterEnum
ALTER TYPE "NoteType" ADD VALUE 'daily';

-- AlterTable
ALTER TABLE "notes" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- GIN index on tags for array contains / overlap queries (filtering still
-- benefits from the existing btree (user_id, type, updated_at) via bitmap AND).
CREATE INDEX "notes_tags_idx" ON "notes" USING GIN ("tags");
