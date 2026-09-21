-- Telegram is a second way into the same account rather than a second account:
-- the row points at a user and the subscription, peers and payments already
-- hanging off that user are what the bot reads.

CREATE TABLE "telegram_account" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    -- Telegram ids exceed the 32-bit range, so BIGINT rather than INTEGER.
    "telegram_id" BIGINT NOT NULL,
    "username" TEXT,
    -- What Telegram reports the client is set to, and what the reader chose
    -- with /language. The second wins where it is set.
    "language_code" TEXT,
    "locale" TEXT,
    "linked_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(3),

    CONSTRAINT "telegram_account_pkey" PRIMARY KEY ("id")
);

-- One Telegram account per user and one user per Telegram account: without both
-- a single subscription could be driven from two chats, or one chat could hold
-- two subscriptions and never know which it is reading.
CREATE UNIQUE INDEX "telegram_account_user_id_key" ON "telegram_account"("user_id");
CREATE UNIQUE INDEX "telegram_account_telegram_id_key" ON "telegram_account"("telegram_id");

ALTER TABLE "telegram_account"
    ADD CONSTRAINT "telegram_account_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The code is typed by a person into a chat, so it is short and short-lived.
CREATE TABLE "telegram_link_code" (
    "code" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_link_code_pkey" PRIMARY KEY ("code")
);

CREATE INDEX "telegram_link_code_user_id_idx" ON "telegram_link_code"("user_id");

ALTER TABLE "telegram_link_code"
    ADD CONSTRAINT "telegram_link_code_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
