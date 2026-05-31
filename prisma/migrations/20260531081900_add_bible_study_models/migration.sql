-- CreateTable
CREATE TABLE "bible_lessons" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "source_filename" TEXT,
    "bible_version" TEXT NOT NULL DEFAULT 'VIE2010',
    "raw_markdown" TEXT NOT NULL,
    "parsed_sections" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bible_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_verses" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "book_code" TEXT NOT NULL,
    "book_name" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "start_verse" INTEGER NOT NULL,
    "end_verse" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'VIE2010',
    "fetch_status" TEXT NOT NULL DEFAULT 'ok',
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bible_verses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_lesson_verses" (
    "lesson_id" TEXT NOT NULL,
    "verse_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bible_lesson_verses_pkey" PRIMARY KEY ("lesson_id","verse_id")
);

-- CreateTable
CREATE TABLE "bible_themes" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#00A76F',
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bible_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_verse_themes" (
    "verse_id" TEXT NOT NULL,
    "theme_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bible_verse_themes_pkey" PRIMARY KEY ("verse_id","theme_id")
);

-- CreateTable
CREATE TABLE "bible_review_states" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "verse_id" TEXT NOT NULL,
    "easiness" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "next_review_date" DATE NOT NULL,
    "last_reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bible_review_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bible_lessons_user_id_date_idx" ON "bible_lessons"("user_id", "date" DESC);

-- CreateIndex
CREATE INDEX "bible_verses_user_id_book_code_chapter_idx" ON "bible_verses"("user_id", "book_code", "chapter");

-- CreateIndex
CREATE UNIQUE INDEX "bible_verses_user_id_book_code_chapter_start_verse_end_vers_key" ON "bible_verses"("user_id", "book_code", "chapter", "start_verse", "end_verse", "version");

-- CreateIndex
CREATE INDEX "bible_lesson_verses_verse_id_idx" ON "bible_lesson_verses"("verse_id");

-- CreateIndex
CREATE INDEX "bible_themes_user_id_order_idx" ON "bible_themes"("user_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "bible_themes_user_id_name_key" ON "bible_themes"("user_id", "name");

-- CreateIndex
CREATE INDEX "bible_verse_themes_theme_id_idx" ON "bible_verse_themes"("theme_id");

-- CreateIndex
CREATE UNIQUE INDEX "bible_review_states_verse_id_key" ON "bible_review_states"("verse_id");

-- CreateIndex
CREATE INDEX "bible_review_states_user_id_next_review_date_idx" ON "bible_review_states"("user_id", "next_review_date");

-- AddForeignKey
ALTER TABLE "bible_lessons" ADD CONSTRAINT "bible_lessons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_verses" ADD CONSTRAINT "bible_verses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_lesson_verses" ADD CONSTRAINT "bible_lesson_verses_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "bible_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_lesson_verses" ADD CONSTRAINT "bible_lesson_verses_verse_id_fkey" FOREIGN KEY ("verse_id") REFERENCES "bible_verses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_themes" ADD CONSTRAINT "bible_themes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_verse_themes" ADD CONSTRAINT "bible_verse_themes_verse_id_fkey" FOREIGN KEY ("verse_id") REFERENCES "bible_verses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_verse_themes" ADD CONSTRAINT "bible_verse_themes_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "bible_themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_review_states" ADD CONSTRAINT "bible_review_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_review_states" ADD CONSTRAINT "bible_review_states_verse_id_fkey" FOREIGN KEY ("verse_id") REFERENCES "bible_verses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

