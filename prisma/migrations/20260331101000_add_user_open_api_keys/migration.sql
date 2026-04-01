-- Add per-user OpenAPI key pair fields
ALTER TABLE "User" ADD COLUMN "openApiAppId" TEXT;
ALTER TABLE "User" ADD COLUMN "openApiPublicKey" TEXT;
ALTER TABLE "User" ADD COLUMN "openApiPrivateKey" TEXT;

CREATE UNIQUE INDEX "User_openApiAppId_key" ON "User"("openApiAppId");
