-- Add weekly calendar scheduling fields to plan_tasks + TimeSlot enum.
-- scheduled_date / scheduled_slot are independent from due_date (deadline vs. plan-to-do day).

-- CreateEnum
CREATE TYPE "TimeSlot" AS ENUM ('morning', 'afternoon', 'evening');

-- AlterTable
ALTER TABLE "plan_tasks" ADD COLUMN     "scheduled_date" DATE,
ADD COLUMN     "scheduled_slot" "TimeSlot";

-- CreateIndex
CREATE INDEX "plan_tasks_plan_id_scheduled_date_idx" ON "plan_tasks"("plan_id", "scheduled_date");
