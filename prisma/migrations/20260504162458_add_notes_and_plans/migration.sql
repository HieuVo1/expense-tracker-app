-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('insight', 'strength', 'weakness', 'idea');

-- CreateEnum
CREATE TYPE "PlanScope" AS ENUM ('weekly', 'monthly');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('do_first', 'schedule', 'delegate', 'eliminate');

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NoteType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "scope" "PlanScope" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_tasks" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "priority" "TaskPriority" NOT NULL,
    "due_date" DATE,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notes_user_id_type_updated_at_idx" ON "notes"("user_id", "type", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "plans_user_id_scope_start_date_idx" ON "plans"("user_id", "scope", "start_date" DESC);

-- CreateIndex
CREATE INDEX "plan_tasks_plan_id_order_created_at_idx" ON "plan_tasks"("plan_id", "order", "created_at");

-- CreateIndex
CREATE INDEX "plan_tasks_plan_id_priority_idx" ON "plan_tasks"("plan_id", "priority");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_tasks" ADD CONSTRAINT "plan_tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
