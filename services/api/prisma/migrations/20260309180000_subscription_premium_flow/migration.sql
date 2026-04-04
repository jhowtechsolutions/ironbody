-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'UNPAID');

-- CreateEnum
CREATE TYPE "BillingPlanType" AS ENUM ('PERSONAL', 'ALUNO');

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "planType" "BillingPlanType";

-- AlterTable Subscription (add new columns)
ALTER TABLE "Subscription" ADD COLUMN "stripePriceId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "planType" "BillingPlanType";
ALTER TABLE "Subscription" ADD COLUMN "status" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE';
ALTER TABLE "Subscription" ADD COLUMN "currentPeriodStart" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN "trialStart" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN "trialEnd" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "canceledAt" TIMESTAMP(3);

UPDATE "Subscription" SET "trialEnd" = "trialEndsAt" WHERE "trialEndsAt" IS NOT NULL;
UPDATE "Subscription" SET "planType" = 'PERSONAL' WHERE "planType" IS NULL;
UPDATE "Subscription" SET "status" = 'ACTIVE' WHERE "stripeSubscriptionId" IS NOT NULL;

ALTER TABLE "Subscription" ALTER COLUMN "planType" SET NOT NULL;

ALTER TABLE "Subscription" DROP COLUMN "plan";
ALTER TABLE "Subscription" DROP COLUMN "trialEndsAt";

CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);
