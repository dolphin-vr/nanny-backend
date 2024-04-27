import "reflect-metadata";
import { JsonController, Post, Body } from "routing-controllers";
import { PrismaClient } from "@prisma/client";
import { ISignup } from "./Auth.types";

const prisma = new PrismaClient();
const { JWT_SECRET, TOKEN_TTL, APP_URL } = process.env;

@JsonController("/auth/signup")
export default class Signup {
  @Post()
  async createUser(@Body() body: ISignup) {
    try {
      const { username, email, password } = body;
			const user = await prisma.user.findFirst({ where: { email } });
  if (user) {
    return new Error("409, Invalid e-mail"); // replace to middleware HttpError
  }
			
    } catch (error) {
      console.log(error);
      return 400; // how to return STATUS 400???
    }
  }
}
