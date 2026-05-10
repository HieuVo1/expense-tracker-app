-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NoteType" ADD VALUE 'GOAL';
ALTER TYPE "NoteType" ADD VALUE 'THOUGHT';
ALTER TYPE "NoteType" ADD VALUE 'LESSON';
ALTER TYPE "NoteType" ADD VALUE 'SIGNAL';
ALTER TYPE "NoteType" ADD VALUE 'PRINCIPLE';
ALTER TYPE "NoteType" ADD VALUE 'TRAIT';
ALTER TYPE "NoteType" ADD VALUE 'ACTION';

-- DropIndex
DROP INDEX "notes_tags_idx";

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "metadata" JSONB;
