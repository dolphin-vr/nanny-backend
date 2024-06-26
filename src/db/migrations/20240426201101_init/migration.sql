-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "salt" TEXT,
    "sessionToken" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'dafault',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nanny" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "birthday" TIMESTAMP(3) NOT NULL,
    "experiense" INTEGER NOT NULL,
    "education" TEXT NOT NULL,
    "kids_age" TEXT NOT NULL,
    "price_per_hour" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "characters" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Nanny_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nanny_id" INTEGER NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "nanny_id" INTEGER NOT NULL,
    "reviewer" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" SERIAL NOT NULL,
    "nanny_id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "child_age" TEXT NOT NULL,
    "parrent_name" TEXT NOT NULL,
    "comment" TEXT NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_nanny_id_fkey" FOREIGN KEY ("nanny_id") REFERENCES "Nanny"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_nanny_id_fkey" FOREIGN KEY ("nanny_id") REFERENCES "Nanny"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_nanny_id_fkey" FOREIGN KEY ("nanny_id") REFERENCES "Nanny"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
