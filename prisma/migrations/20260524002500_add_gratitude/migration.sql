-- CreateTable
CREATE TABLE "gratitude_entries" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "items" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gratitude_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gratitude_entries_user_id_date_idx" ON "gratitude_entries"("user_id", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "gratitude_entries_user_id_date_key" ON "gratitude_entries"("user_id", "date");

-- AddForeignKey
ALTER TABLE "gratitude_entries" ADD CONSTRAINT "gratitude_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
