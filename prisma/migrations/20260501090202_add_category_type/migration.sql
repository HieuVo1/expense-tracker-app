-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "type" "TransactionType" NOT NULL DEFAULT 'expense';

-- CreateIndex
CREATE INDEX "categories_user_id_type_order_idx" ON "categories"("user_id", "type", "order");
