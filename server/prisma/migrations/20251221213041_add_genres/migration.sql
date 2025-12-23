/*
  Warnings:

  - You are about to drop the column `genre` on the `Lyric` table. All the data in the column will be lost.
  - Added the required column `genreId` to the `Lyric` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lyric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'PERSONAL',
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lyric_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lyric_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lyric" ("createdAt", "id", "ownerId", "scope", "text") SELECT "createdAt", "id", "ownerId", "scope", "text" FROM "Lyric";
DROP TABLE "Lyric";
ALTER TABLE "new_Lyric" RENAME TO "Lyric";
CREATE INDEX "Lyric_scope_idx" ON "Lyric"("scope");
CREATE INDEX "Lyric_ownerId_idx" ON "Lyric"("ownerId");
CREATE INDEX "Lyric_genreId_idx" ON "Lyric"("genreId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Genre_key_key" ON "Genre"("key");
