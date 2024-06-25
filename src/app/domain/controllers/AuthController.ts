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

  @HttpCode(200)
  @Post("/verify/:token")
  async verify(@Param("token") token: string) {
    try {
      await AuthService.verifyEmail(token);

      return new ApiResponse(true, "Verification successful");
    } catch (error) {
      if (error instanceof HttpError) {
        throw new HttpError(error.httpCode, error.message);
      } else {
        throw new HttpError(500, "INTERNAL_SERVER_ERROR");
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
      const signedUser=await AuthService.loginUser(email,password);
      return new ApiResponse(true, signedUser);

    } catch (error) {
      if (error instanceof HttpError) {
        throw new HttpError(error.httpCode, error.message );
      } else {
        throw new HttpError(500, "INTERNAL_SERVER_ERROR");
      };
    }
  }

  @Get("/refresh")
  async refresh(@Req() req: Request, @Res() res: Response) {
    try {
      const cookies = req.cookies;
      if (!cookies?.sid) throw new HttpError(401, "UNAUTHORIZED");

      const sessionToken = cookies.sid;
      const accessToken = AuthService.refreshAccess(sessionToken);

      // const { email } = jwt.verify(sessionToken, SESSION_SECRET) as IJwtPayload;
      // const session = await prisma.session.findFirst({ where: { sessionToken } });
      // if (!session) throw new ApiError(403, { code: "FORBIDDEN", message: "Forbidden" }); //|| session.user_id !== id
      // const user = await prisma.user.findFirst({ where: { id: session.user_id } });
      // if (!user) throw new ApiError(403, { code: "FORBIDDEN", message: "Forbidden" }); // ??
      // const accessToken = jwt.sign({ email, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

      // jwt.verify(sessionToken, SESSION_SECRET,
      // (err: VerifyErrors | null, decoded: IJwtPayload) => {
      //  ============================ ?????????????????????
      //   if (err || user.email !== decoded.email) throw new ApiError(403, { code: "FORBIDDEN", message: "Forbidden" });
      //  ============================ ?????????????????????
      //   const accessToken = jwt.sign({email, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
      // });

      return new ApiResponse(true, { accessToken });
    } catch (error) {
      if (error instanceof HttpError) {
        throw new HttpError(error.httpCode, error.message );
      } else {
        throw new HttpError(500, "INTERNAL_SERVER_ERROR");
      };
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

    try {
      const { email } = body;
      await AuthService.sendRemind(email);
      return new ApiResponse(true, { email });
    } catch (error) {
      if (error instanceof HttpError) {
        throw new HttpError(error.httpCode, error.message);
      } else {
        throw new HttpError(500, "INTERNAL_SERVER_ERROR");
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
