-- Plans v2: yearly + backlog scopes, nullable plan dates, life-area tagging,
-- AI Wheel of Life assessment table.

-- CreateEnum
CREATE TYPE "LifeArea" AS ENUM ('HEALTH', 'CAREER', 'FINANCE', 'GROWTH', 'FAMILY', 'SOCIAL', 'RECREATION', 'SPIRITUALITY');

-- AlterEnum: add 'yearly' and 'backlog' to PlanScope. Postgres 12+ allows ADD
-- VALUE in a transaction as long as the new value isn't used in the same
-- transaction. We don't reference them here, so this is safe.
ALTER TYPE "PlanScope" ADD VALUE 'yearly';
ALTER TYPE "PlanScope" ADD VALUE 'backlog';

-- AlterTable: optional life-area tag on tasks
ALTER TABLE "plan_tasks" ADD COLUMN     "life_area" "LifeArea";

-- AlterTable: plan dates become nullable to allow backlog plans (no period).
-- Validation moves to action layer.
ALTER TABLE "plans" ALTER COLUMN "start_date" DROP NOT NULL,
ALTER COLUMN "end_date" DROP NOT NULL;

-- CreateTable: AI Wheel of Life assessment snapshot.
-- JSONB columns shape:
--   scores: { HEALTH: int 1-10, ..., SPIRITUALITY: int 1-10 }
--   suggestions: [{ area: LifeArea, message: string, recommendedTaskTitle?: string }]
--   input_summary: WheelSignals object for transparency
CREATE TABLE "life_wheel_assessments" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_days" INTEGER NOT NULL DEFAULT 30,
    "scores" JSONB NOT NULL,
    "suggestions" JSONB NOT NULL,
    "input_summary" JSONB NOT NULL,

    CONSTRAINT "life_wheel_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "life_wheel_assessments_user_id_computed_at_idx" ON "life_wheel_assessments"("user_id", "computed_at" DESC);

-- CreateIndex
CREATE INDEX "plan_tasks_plan_id_life_area_idx" ON "plan_tasks"("plan_id", "life_area");

-- AddForeignKey
ALTER TABLE "life_wheel_assessments" ADD CONSTRAINT "life_wheel_assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
