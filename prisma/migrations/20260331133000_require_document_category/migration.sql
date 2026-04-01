/*
  Make Document.categoryId required.
  Backfill existing null/empty categoryId to system category "未分类".
*/
PRAGMA foreign_keys=off;

INSERT OR IGNORE INTO "Category" ("id", "name", "description", "createdAt", "updatedAt")
VALUES ('uncategorized-system', '未分类', '系统默认分类', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "Document"
SET "categoryId" = 'uncategorized-system'
WHERE "categoryId" IS NULL OR "categoryId" = '';

CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "parentId" TEXT,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "Document_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Document" (
  "id", "title", "slug", "content", "excerpt", "published", "viewCount", "createdAt", "updatedAt", "parentId", "authorId", "categoryId"
)
SELECT
  "id", "title", "slug", "content", "excerpt", "published", "viewCount", "createdAt", "updatedAt", "parentId", "authorId", "categoryId"
FROM "Document";

DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";

CREATE UNIQUE INDEX "Document_slug_key" ON "Document"("slug");

PRAGMA foreign_keys=on;
