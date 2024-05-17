/*
  Warnings:

  - A unique constraint covering the columns `[user_id,nanny_id]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Favorite_user_id_nanny_id_key" ON "Favorite"("user_id", "nanny_id");
