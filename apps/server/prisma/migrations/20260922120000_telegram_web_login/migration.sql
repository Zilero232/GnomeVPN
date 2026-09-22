-- The bot can now hand a reader a link that signs them in on the website, so a
-- Telegram-born account is not trapped inside Telegram. The code carries no
-- session itself: it is exchanged once, over HTTPS, for a session token.
--
-- It is a table of its own rather than a second meaning for telegram_link_code.
-- That one proves "this chat may drive that account" and is typed in by hand;
-- this one proves "whoever holds this may become that account" and is clicked.
-- One row that means either would be a row nobody can reason about.
CREATE TABLE "telegram_web_login" (
    "code" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_web_login_pkey" PRIMARY KEY ("code")
);

CREATE INDEX "telegram_web_login_user_id_idx" ON "telegram_web_login"("user_id");

ALTER TABLE "telegram_web_login"
    ADD CONSTRAINT "telegram_web_login_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
