-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted');

-- CreateTable
CREATE TABLE "ProjectInvitation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvitation_token_key" ON "ProjectInvitation"("token");

-- CreateIndex
CREATE INDEX "ProjectInvitation_projectId_idx" ON "ProjectInvitation"("projectId");

-- CreateIndex
CREATE INDEX "ProjectInvitation_email_idx" ON "ProjectInvitation"("email");

-- CreateIndex
CREATE INDEX "ProjectInvitation_token_idx" ON "ProjectInvitation"("token");

-- CreateIndex
CREATE INDEX "ProjectInvitation_status_idx" ON "ProjectInvitation"("status");

-- CreateIndex
CREATE INDEX "ProjectInvitation_expiresAt_idx" ON "ProjectInvitation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvitation_projectId_email_status_key" ON "ProjectInvitation"("projectId", "email", "status");

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
