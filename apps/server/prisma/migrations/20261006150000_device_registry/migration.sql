-- AlterTable
ALTER TABLE "peer" ADD COLUMN     "device_id" TEXT,
ADD COLUMN     "revoked_at" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "subscription_link" ADD COLUMN     "blocked_key" TEXT,
ADD COLUMN     "blocked_notice_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "device" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "hwid" TEXT,
    "platform" TEXT,
    "model" TEXT,
    "os_version" TEXT,
    "app" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "device_user_id_created_at_idx" ON "device"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "device_user_id_key_key" ON "device"("user_id", "key");

-- CreateIndex
CREATE INDEX "peer_device_id_idx" ON "peer"("device_id");

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer" ADD CONSTRAINT "peer_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

