-- CreateTable
CREATE TABLE "user_login_event" (
    "user_login_event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_login_event_pkey" PRIMARY KEY ("user_login_event_id")
);

-- CreateIndex
CREATE INDEX "user_login_event_user_id_idx" ON "user_login_event"("user_id");

-- CreateIndex
CREATE INDEX "user_login_event_created_at_idx" ON "user_login_event"("created_at");
