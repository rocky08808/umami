-- CreateTable
CREATE TABLE "user_wallet" (
    "user_wallet_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USDT',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_wallet_pkey" PRIMARY KEY ("user_wallet_id")
);

-- CreateTable
CREATE TABLE "wallet_transaction" (
    "wallet_transaction_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balance_after" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USDT',
    "description" VARCHAR(255),
    "reference_type" VARCHAR(50),
    "reference_id" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transaction_pkey" PRIMARY KEY ("wallet_transaction_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_wallet_user_id_key" ON "user_wallet"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transaction_reference_type_reference_id_key" ON "wallet_transaction"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "wallet_transaction_user_id_idx" ON "wallet_transaction"("user_id");

-- CreateIndex
CREATE INDEX "wallet_transaction_wallet_id_idx" ON "wallet_transaction"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_transaction_created_at_idx" ON "wallet_transaction"("created_at");
