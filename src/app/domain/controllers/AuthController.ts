import "reflect-metadata";
import { JsonController, Post, Body, Param } from "routing-controllers";
import { PrismaClient } from "@prisma/client";
import { ApiResponse } from "helpers/ApiResponse";
import { ApiError } from "helpers/ApiError";
import { hashPassword, random } from "helpers";
import { SignupDto } from "dto/Signup.dto";
import { validate } from "class-validator";
import jwt from "jsonwebtoken";
import sendEmail from "helpers/sendEmail";
import { jwtDecode } from "jwt-decode";
import { IJwtPayload } from "types/payload";
import { SigninDto } from "dto/Signin.dto";

const prisma = new PrismaClient();
const { VERIFICATION_TOKEN_TTL, SESSION_TOKEN_TTL, ACCESS_TOKEN_TTL, APP_URL } = process.env;
const JWT_SECRET: string = process.env.JWT_SECRET as string;

@JsonController("/auth")
export default class AuthController {
  @Post("/signup")
  async signup(@Body() body: SignupDto) {
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
      const user = await prisma.user.findFirst({ where: { email } });
      if (user) {
        return new ApiError(409, { code: "INVALID_EMAIL", message: "Invalid e-mail" });
      }

      const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: VERIFICATION_TOKEN_TTL });
      const salt = random();
      const newUser = await prisma.user.create({ data: { username, email, password: hashPassword(salt, password), salt, sessionToken: verificationToken } });

      const verificationEmail = {
        to: email,
        subject: "Verification email",
        html: `<p>Thank you for registering!</p><p><a href="${APP_URL}/verify/${verificationToken}" target="_blank">Click to verify your email</a></p>`,
      };
      const send = await sendEmail(verificationEmail);
      // console.log("send= ", send)
      return new ApiResponse(true, { email: newUser.email });
    } catch (error) {
      console.log(error);
      return new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }

  @Post("/verify/:token")
  async verify(@Param("token") token: string) {
    const { email } = jwtDecode(token) as IJwtPayload;
    // console.log('email=', email)
    const user = await prisma.user.findFirst({ where: { email } });
    // console.log('user= ', user)
    if (!user) {
      return new ApiError(404, { code: "USER_NOT_FOUND", message: "User not found" });
    }
    const upd = await prisma.user.update({ where: { email }, data: { verified: true, sessionToken: "" } });
    // console.log('upd= ', upd)
    return new ApiResponse(true, "Verification successful");
  }

  @Post("/signin")
  async signin(@Body() body: SigninDto) {
    const errors = await validate(body);
    if (errors.length > 0) {
      throw new ApiError(400, {
        message: "Validation failed",
        code: "SIGNIN_VALIDATION_ERROR",
        errors,
      });
    }

    try {
      const { email, password } = body;
      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        return new ApiError(401, { code: "INVALID_EMAIL_OR_PASSWORD", message: "E-mail or password invalid" });
      }
      if (!user.verified) {
        return new ApiError(418, { code: "EMAIL_NOT_VERIFIED", message: "E-mail is not verified" });
      }
      const hashedPassword: string = hashPassword(user.salt, password);
      if (hashedPassword !== user.password) {
        return new ApiError(401, { code: "INVALID_EMAIL_OR_PASSWORD", message: "E-mail or password invalid" });
      }

      const sessionToken = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: SESSION_TOKEN_TTL });
      const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
      await prisma.user.update({ where: { id: user.id }, data: { email, sessionToken, accessToken } });

      return new ApiResponse(true, { email, sessionToken, accessToken });
    } catch (error) {
      console.log(error);
      return new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }
}
