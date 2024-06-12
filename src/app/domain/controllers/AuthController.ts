import "reflect-metadata";
import { JsonController, Post, Body, Param, Req, Patch, CookieParam, Res, Get, HttpError, HttpCode } from "routing-controllers";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt, { VerifyErrors } from "jsonwebtoken";
import { IJwtPayload } from "types/extended";
import { PasswdRemindDto, PasswdResetDto, SigninDto, SignupDto } from "../../../dto";
import { ApiError, ApiResponse, checkToken, hashPassword, sendEmail } from "../../../helpers";
import { DBService, AuthService } from "../../../services";

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
  @HttpCode(201)
  @Post("/signup")
  async signup(@Body() body: SignupDto) {
    try {
      const { email } = body;
      await AuthService.createUser(body);

      return new ApiResponse(true, { email });
    } catch (error) {
      if (error instanceof HttpError) {
        throw new HttpError(error.httpCode, error.message);
      } else {
        throw new HttpError(500, "INTERNAL_SERVER_ERROR");
      }
    }
  }

  @Post("/verify/:token")
  async verify(@Param("token") token: string) {
    try {
      const checkedToken = checkToken(token);
      if (checkedToken.expired || !checkedToken.valid) return new ApiResponse(false, "Token expired or invalid");
      const email = checkedToken.email as string;
      const user = DBService.findUserByEmail(email);
      if (!user) throw new ApiError(404, { code: "USER_NOT_FOUND", message: "User not found" });

      // const { email } = jwt.verify(token, SESSION_SECRET) as IJwtPayload;
      // if (!email) {
      //   throw new ApiError(404, { code: "USER_NOT_FOUND", message: "User not found" });
      // }
      // const user = await DBService.findUserByEmail(email);
      // if (!user) {
      //   throw new ApiError(404, { code: "USER_NOT_FOUND", message: "User not found" });
      // }
      // const verificationToken = await DBService.findSession(user.id, token)
      // if (!verificationToken) {
      //   throw new ApiError(404, { code: "USER_NOT_FOUND", message: "User not found" }); // ?? error code and message ?? sth about token?
      // }

      await DBService.verifyEmail(email);
      await DBService.deleteSessionByToken(token);
      return new ApiResponse(true, "Verification successful");
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(error.error.status, { code: error.error.code, message: error.message }); // code: error.code,
      } else {
        throw new ApiError(500, { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" });
      }
    }
  }

  /**
   *
   * @param body = { email: valid email, password: string (min 7, max 48) }
   * @returns
   */
  @Post("/signin")
  async signin(@Body() body: SigninDto, @Res() res: Response) {
    try {
      const { email, password } = body;
      const user = await DBService.findUserByEmail(email);
      if (!user) {
        throw new ApiError(401, { code: "INVALID_EMAIL_OR_PASSWORD", message: "E-mail or password invalid" });
      }
      if (!user.verified) {
        throw new ApiError(418, { code: "EMAIL_NOT_VERIFIED", message: "E-mail is not verified" });
      }
      const hashedPassword: string = hashPassword(user.salt, password);
      if (hashedPassword !== user.password) {
        throw new ApiError(401, { code: "INVALID_EMAIL_OR_PASSWORD", message: "E-mail or password invalid" });
      }

      const sessionToken = jwt.sign({ email }, SESSION_SECRET, { expiresIn: SESSION_TOKEN_TTL });
      const accessToken = jwt.sign({ email, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

      await DBService.createSession(user.id, sessionToken);

      res.cookie("sid", sessionToken, { httpOnly: true, sameSite: "none", secure: true, maxAge: SESSION_MAX_AGE });

      return new ApiResponse(true, { email, accessToken, username: user.username, avatar: user.avatar, theme: user.theme });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(error.error.status, { code: error.error.code, message: error.error.message });
        // throw new ApiError(error.status, { message: error.message }); // code: error.code,
      } else {
        throw new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
        // throw new ApiError(500, { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" });
      }
    }
  }

  @Get("/refresh")
  async refresh(@Req() req: Request, @Res() res: Response) {
    try {
      const cookies = req.cookies;
      if (!cookies?.sid) throw new ApiError(401, { code: "UNAUTHORIZED", message: "Unauthorized" });
      const sessionToken = cookies.sid;
      const { email } = jwt.verify(sessionToken, SESSION_SECRET) as IJwtPayload;
      const session = await prisma.session.findFirst({ where: { sessionToken } });
      if (!session) throw new ApiError(403, { code: "FORBIDDEN", message: "Forbidden" }); //|| session.user_id !== id
      const user = await prisma.user.findFirst({ where: { id: session.user_id } });
      if (!user) throw new ApiError(403, { code: "FORBIDDEN", message: "Forbidden" }); // ??
      const accessToken = jwt.sign({ email, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

      // jwt.verify(sessionToken, SESSION_SECRET,
      // (err: VerifyErrors | null, decoded: IJwtPayload) => {
      //  ============================ ?????????????????????
      //   if (err || user.email !== decoded.email) throw new ApiError(403, { code: "FORBIDDEN", message: "Forbidden" });
      //  ============================ ?????????????????????
      //   const accessToken = jwt.sign({email, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
      // });

      return new ApiResponse(true, { email, accessToken });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(error.error.status, { code: error.error.code, message: error.error.message });
        // throw new ApiError(error.status, { message: error.message }); // code: error.code,
      } else {
        throw new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
        // throw new ApiError(500, { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" });
      }
    }
  }

  @Post("/signout")
  async signout(@CookieParam("sid") token: string, @Res() res: Response) {
    console.log("sid= ", token);
    if (!token) throw new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });

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
    // const errors = await validate(body);
    // if (errors.length > 0) {
    //   throw new ApiError(400, {
    //     message: "Validation failed",
    //     code: "REMIND_VALIDATION_ERROR",
    //     errors,
    //   });
    // }

    try {
      const { email } = body;
      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        throw new ApiError(401, { code: "INVALID_EMAIL", message: "Invalid e-mail" });
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
      if (error instanceof ApiError) {
        throw new ApiError(error.error.status, { code: error.error.code, message: error.error.message });
        // throw new ApiError(error.status, {  message: error.message }); // code: error.code,
      } else {
        throw new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
        // throw new ApiError(500, { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" });
      }
    }
  }

  /**
   *
   * @param body  = { password: string (min 7, max 48), token: JWT }
   * @returns
   */
  @Patch("/reset")
  async reset(@Body() body: PasswdResetDto) {
    // const errors = await validate(body);
    // if (errors.length > 0) {
    //   throw new ApiError(400, {
    //     message: "Validation failed",
    //     code: "RESET_VALIDATION_ERROR",
    //     errors,
    //   });
    // }

    try {
      const { password, token } = body;
      const { email } = jwt.verify(token, SESSION_SECRET) as IJwtPayload;
      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        throw new ApiError(404, { code: "USER_NOT_FOUND", message: "User not found" });
      }
      await prisma.user.update({ where: { id: user.id }, data: { password: hashPassword(user.salt, password) } });
      await prisma.session.deleteMany({ where: { user_id: user.id } }); // delete all active sessions
      return new ApiResponse(true, "Password was changed successfuly");
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(error.error.status, { code: error.error.code, message: error.error.message });
        // throw new ApiError(error.status, {  message: error.message }); // code: error.code,
      } else {
        throw new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
        // throw new ApiError(500, { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" });
      }
    }
  }
}
