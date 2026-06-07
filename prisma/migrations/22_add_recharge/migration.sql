-- CreateTable
CREATE TABLE "user_subscription" (
    "user_subscription_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan" VARCHAR(50) NOT NULL DEFAULT 'hobby',
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_subscription_pkey" PRIMARY KEY ("user_subscription_id")
);

-- CreateTable
CREATE TABLE "recharge_order" (
    "recharge_order_id" UUID NOT NULL,
    "order_no" VARCHAR(50) NOT NULL,
    "user_id" UUID NOT NULL,
    "plan" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USDT',
    "network" VARCHAR(20) NOT NULL DEFAULT 'TRC20',
    "tx_id" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "admin_note" VARCHAR(500),
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "period_days" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "recharge_order_pkey" PRIMARY KEY ("recharge_order_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_subscription_user_id_key" ON "user_subscription"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "recharge_order_order_no_key" ON "recharge_order"("order_no");

-- CreateIndex
CREATE INDEX "recharge_order_user_id_idx" ON "recharge_order"("user_id");

-- CreateIndex
CREATE INDEX "recharge_order_status_idx" ON "recharge_order"("status");

-- CreateIndex
CREATE INDEX "recharge_order_tx_id_idx" ON "recharge_order"("tx_id");

-- CreateIndex
CREATE INDEX "recharge_order_created_at_idx" ON "recharge_order"("created_at");
