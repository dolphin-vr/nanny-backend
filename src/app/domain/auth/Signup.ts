import "reflect-metadata";
import { JsonController, Post, Body } from "routing-controllers";
import { PrismaClient } from "@prisma/client";
import { ISignup } from "../../../types/Auth.types";
import { ApiResponse } from "helpers/ApiResponse";
import { ApiError } from "helpers/ApiError";
import { hashPassword, random } from "helpers";
import { SignupDto } from "dto/Signup.dto";
import { validate } from "class-validator";
import jwt from "jsonwebtoken";
import sendEmail from "helpers/sendEmail";

const prisma = new PrismaClient();
const { VERIFICATION_TOKEN_TTL, APP_URL } = process.env;
const JWT_SECRET: string = process.env.JWT_SECRET as string;

@JsonController("/auth/signup")
export default class Signup {
  @Post()
  async createUser(@Body() body: SignupDto) {
    const errors = await validate(body);
    if (errors.length > 0) {
      throw new ApiError(400, {
        message: "Validation failed",
        code: "SIGNUP_VALIDATION_ERROR",
        errors,
      });
    }

    try {
      const { username, email, password } = body;
			// console.log("sup-1");
      const user = await prisma.user.findFirst({ where: { email } });
      if (user) {
        return new ApiError(409, { code: "INVALID_EMAIL", message: "Invalid e-mail" });
      }
			// console.log("sup-2");

      const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: VERIFICATION_TOKEN_TTL });
      const salt = random();
      const newUser = await prisma.user.create({ data: { username, email, password: hashPassword(salt, password), salt, sessionToken: verificationToken } });
			// console.log("sup-3");

      const verificationEmail = {
        to: email,
        subject: "Verification email",
        html: `<p>Thank you for registering!</p><p><a href="${APP_URL}/verify/${verificationToken}" target="_blank">Click to verify your email</a></p>`,
      };
      // console.log("send-1")
      const send = await sendEmail(verificationEmail);
      // console.log("send= ", send)
      return new ApiResponse(true, { email: newUser.email });

    } catch (error) {
      console.log(error);
      return new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }
}
