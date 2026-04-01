/*
  Remove openApiAppId from User and keep user data/relations.
*/
PRAGMA foreign_keys=off;

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'API_USER',
    "openApiPublicKey" TEXT,
    "openApiPrivateKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_User" (
  "id", "email", "name", "password", "role", "openApiPublicKey", "openApiPrivateKey", "createdAt", "updatedAt"
)
SELECT
  "id", "email", "name", "password", "role", "openApiPublicKey", "openApiPrivateKey", "createdAt", "updatedAt"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

PRAGMA foreign_keys=on;
