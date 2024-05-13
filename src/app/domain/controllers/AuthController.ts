import "reflect-metadata";
import { JsonController, Post, Body, Param, UseBefore, Req, Patch, CookieParam, Res, Get } from "routing-controllers";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt, { VerifyErrors } from "jsonwebtoken";
import { IJwtPayload, IRequest } from "types/extended";
import { SignupDto } from "../../../dto/Signup.dto";
import { SigninDto } from "../../../dto/Signin.dto";
import { PasswdRemindDto } from "../../../dto/PasswdRemind.dto";
import { PasswdResetDto } from "../../../dto/PasswdReset.dto";
import { ApiError, ApiResponse, hashPassword, random, sendEmail } from "../../../helpers";

const prisma = new PrismaClient();
const { VERIFICATION_TOKEN_TTL, SESSION_TOKEN_TTL, ACCESS_TOKEN_TTL, APP_URL } = process.env;
const SESSION_SECRET: string = process.env.SESSION_SECRET as string;
const ACCESS_SECRET: string = process.env.ACCESS_SECRET as string;

// session cookie maxAge. default 1d = 86400000ms
const SESSION_MAX_AGE: number = SESSION_TOKEN_TTL?.includes("d")
  ? parseInt(SESSION_TOKEN_TTL) * 24 * 60 * 60 * 1000
  : SESSION_TOKEN_TTL?.includes("h")
  ? parseInt(SESSION_TOKEN_TTL) * 60 * 60 * 1000
  : 86400000;

@JsonController("/auth")
export default class AuthController {
  /**
   *
   * @param body = { username: string, email: valid email, password: string (min 7, max 48) }
   * @returns
   */
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

      const verificationToken = jwt.sign({ email }, SESSION_SECRET, { expiresIn: VERIFICATION_TOKEN_TTL });
      const salt = random();
      const newUser = await prisma.user.create({ data: { username, email, password: hashPassword(salt, password), salt } });
      await prisma.session.create({ data: { user_id: newUser.id, sessionToken: verificationToken } });

      const verificationEmail = {
        to: email,
        subject: "NannyService verification email",
        html: `<p>Thank you for registering!</p><p><a href="${APP_URL}/verify/${verificationToken}" target="_blank">Click to verify your email</a></p>`,
      };
      await sendEmail(verificationEmail);
      return new ApiResponse(true, { email: newUser.email });
    } catch (error) {
      console.log(error);
      return new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }

  @Post("/verify/:token")
  async verify(@Param("token") token: string) {
    // TRY-CATCH ???
    const { email } = jwt.verify(token, SESSION_SECRET) as IJwtPayload;
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return new ApiError(404, { code: "USER_NOT_FOUND", message: "User not found" });
    }
    const verificationToken = await prisma.session.findFirst({ where: { user_id: user.id, sessionToken: token } });
    if (!verificationToken) {
      return new ApiError(404, { code: "USER_NOT_FOUND", message: "User not found" }); // ?? error code and message ?? sth about token?
    }
    await prisma.user.update({ where: { email }, data: { verified: true } });
    await prisma.session.delete({ where: { id: verificationToken.id } });
    return new ApiResponse(true, "Verification successful");
  }

  /**
   *
   * @param body = { email: valid email, password: string (min 7, max 48) }
   * @returns
   */
  @Post("/signin")
  async signin(@Body() body: SigninDto, @Res() res: Response) {
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

      const sessionToken = jwt.sign({ id: user.id, email }, SESSION_SECRET, { expiresIn: SESSION_TOKEN_TTL });
      const accessToken = jwt.sign({ id: user.id, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

      await prisma.session.create({ data: { user_id: user.id, sessionToken } });

      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      //
      //                                                       PUT sessionToken IN COOKIE!!!!
      //
      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      res.cookie("sid", sessionToken, { httpOnly: true, sameSite: "none", secure: true, maxAge: SESSION_MAX_AGE });

      return new ApiResponse(true, { email, accessToken });
    } catch (error) {
      console.log(error);
      return new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }

  // refresh ???
  @Get("/refresh")
  async refresh(@Req() req: Request, @Res() res: Response) {
    try {
      const cookies = req.cookies;
      if (!cookies?.sid) return new ApiError(401, { code: "UNAUTHORIZED", message: "Unauthorized" });
      const sessionToken = cookies.sid;
      const { id, email } = jwt.verify(sessionToken, SESSION_SECRET) as IJwtPayload;
      const session = await prisma.session.findFirst({ where: { sessionToken } });
      if (!session || session.user_id !== id) return new ApiError(403, { code: "FORBIDDEN", message: "Forbidden" });
      const user = await prisma.user.findFirst({ where: { id: session.user_id } });
      if (!user) return new ApiError(403, { code: "FORBIDDEN", message: "Forbidden" }); // ??
      const accessToken = jwt.sign({ id: user.id, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

      // jwt.verify(sessionToken, SESSION_SECRET,
      // (err: VerifyErrors | null, decoded: IJwtPayload) => {
      //  ============================ ?????????????????????
      //   if (err || user.email !== decoded.email) return new ApiError(403, { code: "FORBIDDEN", message: "Forbidden" });
      //  ============================ ?????????????????????
      //   const accessToken = jwt.sign({ id: user.id, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
      // });

      return new ApiResponse(true, { email, accessToken });
    } catch (error) {
      console.log(error);
      return new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }

  @Post("/signout")
  async signout(@CookieParam("sid") token: string, @Res() res: Response) {
    console.log("sid= ", token);
    if (!token) return new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });

    const { id } = jwt.verify(token, SESSION_SECRET) as IJwtPayload;
    const session = await prisma.session.findFirst({ where: { user_id: id, sessionToken: token } });
    // or just
    // const session = await prisma.session.findFirst({ where: { sessionToken: token } });

    if (session) await prisma.session.delete({ where: { sessionToken: token } }); // user_id ?

    //  CLEAR COOKIE!!!
    res.clearCookie("sid", { httpOnly: true, sameSite: "none", secure: true });

    return new ApiResponse(true, "Signout successful");
  }

  /**
   *
   * @param body = {"email": "valid email"}
   * @returns
   */
  @Post("/remind")
  async remind(@Body() body: PasswdRemindDto) {
    const errors = await validate(body);
    if (errors.length > 0) {
      throw new ApiError(400, {
        message: "Validation failed",
        code: "REMIND_VALIDATION_ERROR",
        errors,
      });
    }

    try {
      const { email } = body;
      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        return new ApiError(401, { code: "INVALID_EMAIL", message: "Invalid e-mail" });
      }
      const payload = { email: user.email };
      const verificationToken = jwt.sign(payload, SESSION_SECRET, { expiresIn: VERIFICATION_TOKEN_TTL });
      await prisma.session.create({ data: { user_id: user.id, sessionToken: verificationToken } });
      const resetpasswdEmail = {
        to: email,
        subject: "NannyService Password reset",
        html: `<p><a href="${APP_URL}/reset/${verificationToken}" target="_blank">Click to reset your password</a></p>`,
      };
      await sendEmail(resetpasswdEmail);
      return new ApiResponse(true, { email });
    } catch (error) {
      console.log(error);
      return new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }

  /**
   *
   * @param body  = { password: string (min 7, max 48), token: JWT }
   * @returns
   */
  @Patch("/reset")
  async reset(@Body() body: PasswdResetDto) {
    const errors = await validate(body);
    if (errors.length > 0) {
      throw new ApiError(400, {
        message: "Validation failed",
        code: "RESET_VALIDATION_ERROR",
        errors,
      });
    }

    try {
      const { password, token } = body;
      const { email } = jwt.verify(token, SESSION_SECRET) as IJwtPayload;
      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        return new ApiError(404, { code: "USER_NOT_FOUND", message: "User not found" });
      }
      await prisma.user.update({ where: { id: user.id }, data: { password: hashPassword(user.salt, password) } });
      await prisma.session.deleteMany({ where: { user_id: user.id } }); // delete all active sessions
      return new ApiResponse(true, "Password was changed successfuly");
    } catch (error) {
      console.log(error);
      return new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }
}
