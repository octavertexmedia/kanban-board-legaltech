-- CreateEnum
CREATE TYPE "UserKind" AS ENUM ('INTERNAL', 'CLIENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "userKind" "UserKind" NOT NULL DEFAULT 'INTERNAL';

CREATE INDEX "User_userKind_idx" ON "User"("userKind");

-- CreateEnum
CREATE TYPE "ProjectMemberRole" AS ENUM ('OWNER', 'MEMBER', 'CLIENT');

-- Migrate ProjectMember.role from TEXT to enum
ALTER TABLE "ProjectMember" ADD COLUMN "role_new" "ProjectMemberRole";

UPDATE "ProjectMember" SET "role_new" = CASE
  WHEN LOWER(TRIM("role")) = 'owner' THEN 'OWNER'::"ProjectMemberRole"
  WHEN LOWER(TRIM("role")) = 'client' THEN 'CLIENT'::"ProjectMemberRole"
  ELSE 'MEMBER'::"ProjectMemberRole"
END;

ALTER TABLE "ProjectMember" DROP COLUMN "role";
ALTER TABLE "ProjectMember" RENAME COLUMN "role_new" TO "role";
ALTER TABLE "ProjectMember" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "ProjectMember" ALTER COLUMN "role" SET DEFAULT 'MEMBER'::"ProjectMemberRole";

-- CreateEnum
CREATE TYPE "StatusUpdateVisibility" AS ENUM ('INTERNAL', 'CLIENT');

-- CreateTable
CREATE TABLE "ProjectStatusUpdate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "StatusUpdateVisibility" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectStatusUpdate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectStatusUpdate_projectId_idx" ON "ProjectStatusUpdate"("projectId");
CREATE INDEX "ProjectStatusUpdate_authorId_idx" ON "ProjectStatusUpdate"("authorId");
CREATE INDEX "ProjectStatusUpdate_createdAt_idx" ON "ProjectStatusUpdate"("createdAt");

ALTER TABLE "ProjectStatusUpdate" ADD CONSTRAINT "ProjectStatusUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectStatusUpdate" ADD CONSTRAINT "ProjectStatusUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
