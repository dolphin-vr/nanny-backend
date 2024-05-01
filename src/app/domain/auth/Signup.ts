import "reflect-metadata";
import { JsonController, Post, Body } from "routing-controllers";
import { PrismaClient } from "@prisma/client";
import { ISignup } from "./Auth.types";
import { ApiResponse } from "helpers/ApiResponse";
import { ApiError } from "helpers/ApiError";
import { hashPassword, random } from "helpers";

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
        return new ApiError(409, { code: "INVALID_EMAIL", message: "Invalid e-mail" });
      }
      const salt = random();
      const newUser = await prisma.user.create({ data: { username, email, password: hashPassword(salt, password), salt } });
      return new ApiResponse(true, { email: newUser.email });
    } catch (error) {
      console.log(error);
      return new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }
}
