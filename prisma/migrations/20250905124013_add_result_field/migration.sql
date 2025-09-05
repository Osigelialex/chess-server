/*
  Warnings:

  - You are about to drop the column `status` on the `Game` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Result" AS ENUM ('CHECKMATE', 'RESIGN', 'DRAW');

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "status",
ADD COLUMN     "result" "Result";

-- DropEnum
DROP TYPE "Status";
