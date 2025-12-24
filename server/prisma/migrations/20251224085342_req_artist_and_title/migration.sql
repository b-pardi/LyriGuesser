/*
  Warnings:

  - Made the column `artist` on table `Lyric` required. This step will fail if there are existing NULL values in that column.
  - Made the column `songTitle` on table `Lyric` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lyric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,
    "songTitle" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'PERSONAL',
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lyric_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lyric_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lyric" ("artist", "createdAt", "genreId", "id", "ownerId", "scope", "songTitle", "text") SELECT "artist", "createdAt", "genreId", "id", "ownerId", "scope", "songTitle", "text" FROM "Lyric";
DROP TABLE "Lyric";
ALTER TABLE "new_Lyric" RENAME TO "Lyric";
CREATE INDEX "Lyric_scope_idx" ON "Lyric"("scope");
CREATE INDEX "Lyric_ownerId_idx" ON "Lyric"("ownerId");
CREATE INDEX "Lyric_genreId_idx" ON "Lyric"("genreId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
