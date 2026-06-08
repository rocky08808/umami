-- AlterTable
ALTER TABLE "recharge_order" ADD COLUMN "pay_amount" DECIMAL(10, 2);
ALTER TABLE "recharge_order" ADD COLUMN "expires_at" TIMESTAMPTZ(6);

-- Backfill existing orders
UPDATE "recharge_order" SET "pay_amount" = "amount" WHERE "pay_amount" IS NULL;

-- CreateIndex
CREATE INDEX "recharge_order_pay_amount_idx" ON "recharge_order"("pay_amount");
CREATE INDEX "recharge_order_expires_at_idx" ON "recharge_order"("expires_at");
