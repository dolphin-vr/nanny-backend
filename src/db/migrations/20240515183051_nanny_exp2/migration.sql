/*
  Warnings:

  - You are about to drop the column `experiense` on the `Nanny` table. All the data in the column will be lost.
  - Added the required column `experience` to the `Nanny` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Nanny" DROP COLUMN "experiense",
ADD COLUMN     "experience" TEXT NOT NULL;
