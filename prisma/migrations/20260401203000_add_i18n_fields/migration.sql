-- Add i18n columns for category
ALTER TABLE "Category"
  ADD COLUMN "nameEn" TEXT,
  ADD COLUMN "nameZh" TEXT,
  ADD COLUMN "descriptionEn" TEXT,
  ADD COLUMN "descriptionZh" TEXT;

-- Add i18n columns for document
ALTER TABLE "Document"
  ADD COLUMN "titleEn" TEXT,
  ADD COLUMN "titleZh" TEXT,
  ADD COLUMN "contentEn" TEXT,
  ADD COLUMN "contentZh" TEXT,
  ADD COLUMN "excerptEn" TEXT,
  ADD COLUMN "excerptZh" TEXT;

-- Backfill existing data into zh fields for compatibility
UPDATE "Category"
SET
  "nameZh" = COALESCE("nameZh", "name"),
  "descriptionZh" = COALESCE("descriptionZh", "description");

UPDATE "Document"
SET
  "titleZh" = COALESCE("titleZh", "title"),
  "contentZh" = COALESCE("contentZh", "content"),
  "excerptZh" = COALESCE("excerptZh", "excerpt");
