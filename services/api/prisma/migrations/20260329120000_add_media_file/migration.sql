-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('PHOTO_PROGRESS', 'PHOTO_ASSESSMENT', 'EXERCISE_VIDEO', 'EXERCISE_GIF', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaEntityType" AS ENUM ('USER_PROGRESS', 'ASSESSMENT', 'EXERCISE', 'PROFILE', 'OTHER');

-- CreateTable
CREATE TABLE "MediaFile" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "entityType" "MediaEntityType" NOT NULL,
    "entityId" TEXT,
    "kind" "MediaKind" NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaFile_objectKey_key" ON "MediaFile"("objectKey");

-- CreateIndex
CREATE INDEX "MediaFile_ownerUserId_idx" ON "MediaFile"("ownerUserId");

-- CreateIndex
CREATE INDEX "MediaFile_entityType_entityId_idx" ON "MediaFile"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "MediaFile_kind_idx" ON "MediaFile"("kind");

-- AddForeignKey
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
