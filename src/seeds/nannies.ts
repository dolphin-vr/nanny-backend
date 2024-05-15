import { PrismaClient } from "@prisma/client";
import { Nanny } from "@prisma/client";
import { Review } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
// import nanny from './babysitters.json';

const prisma = new PrismaClient();

interface INanny extends Nanny {
  reviews: Review[];
}

export const seedNannies = async () => {
  try {
    const babysitters: string = path.resolve("src", "seeds", "babysitters.json");
    const buff: Buffer = await fs.readFile(babysitters);
    const nannies: INanny[] = JSON.parse(buff.toString());
    nannies.forEach(async nanny => {
      const { reviews, ...data } = nanny;
      const newNanny = await prisma.nanny.create({ data });
      console.log("newNanny= ", newNanny);
      reviews.forEach(async review => {
        const newReview = await prisma.review.create({ data: { ...review, nanny_id: newNanny.id } });
        console.log("newReview= ", newReview);
      });
    });
  } catch (error) {
    console.error("Error = ", error);
  }
};
