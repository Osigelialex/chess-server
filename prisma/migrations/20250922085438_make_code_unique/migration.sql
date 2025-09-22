/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `GuestGame` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "GuestGame_code_key" ON "GuestGame"("code");
