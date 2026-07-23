-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('subscription', 'extraDevices');

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "extra_devices" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kind" "PaymentKind" NOT NULL DEFAULT 'subscription';

-- AlterTable
ALTER TABLE "subscription" ADD COLUMN     "extra_devices" INTEGER NOT NULL DEFAULT 0;

