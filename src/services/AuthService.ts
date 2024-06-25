import jwt from "jsonwebtoken";
import { SignupDto } from "../dto";
import { DBService, mailService } from ".";
import { ApiError, checkToken, hashPassword } from "../helpers";
import { BadRequestError, HttpError } from "routing-controllers";
import { IJwtPayload } from "types/extended";

const { VERIFICATION_TOKEN_TTL, SESSION_TOKEN_TTL, ACCESS_TOKEN_TTL, APP_URL } = process.env;
const SESSION_SECRET: string = process.env.SESSION_SECRET as string;
const ACCESS_SECRET: string = process.env.ACCESS_SECRET as string;

class AuthService {
  async createUser(userData: SignupDto) {
    try {
      const { email } = userData;
      const user = await DBService.findUserByEmail(email);
      if (user) throw new HttpError(409, "INVALID_EMAIL");

      const verificationToken = jwt.sign({ email }, SESSION_SECRET, { expiresIn: VERIFICATION_TOKEN_TTL });
      const newUser = await DBService.createUser(userData);
      await DBService.createSession(newUser.id, verificationToken);
      await mailService.sendActivationEmail(email, verificationToken);
      // return true;
    } catch (error) {
      if (error instanceof HttpError) {
        throw new HttpError(error.httpCode, error.message );
      } else {
        throw new HttpError(500, "INTERNAL_SERVER_ERROR");
      };
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const checkedToken = checkToken(token);
      if (checkedToken.expired || !checkedToken.valid) {
        await DBService.deleteSessionByToken(token);
        throw new HttpError(401, "INVALID_TOKEN");
      }
      const email = checkedToken.email as string;
      const user = DBService.findUserByEmail(email);
      if (!user) throw new HttpError(401, "USER_NOT_FOUND");
      await DBService.verifyEmail(email);
      await DBService.deleteSessionByToken(token);
      // return true;
    } catch (error) {
      if (error instanceof HttpError) {
        throw new HttpError(error.httpCode, error.message );
      } else {
        throw new HttpError(500, "INTERNAL_SERVER_ERROR");
      };
      // console.log(error);
    }
  }

  async loginUser(email: string, passwd: string) {
    try {
      const user = await DBService.findUserByEmail(email);
      if (!user) {
        throw new HttpError(401, "INVALID_EMAIL_OR_PASSWORD"); //  ApiError(401, { code: "INVALID_EMAIL_OR_PASSWORD", message: "E-mail or password invalid" });
      }
      if (!user.verified) {
        throw new HttpError(418, "EMAIL_NOT_VERIFIED"); //  ApiError(418, { code: "EMAIL_NOT_VERIFIED", message: "E-mail is not verified" });
      }
      const hashedPassword: string = hashPassword(user.salt, passwd);
      if (hashedPassword !== user.password) {
        throw new HttpError(401, "INVALID_EMAIL_OR_PASSWORD"); // ApiError(401, { code: "INVALID_EMAIL_OR_PASSWORD", message: "E-mail or password invalid" });
      }

      const sessionToken = jwt.sign({ email }, SESSION_SECRET, { expiresIn: SESSION_TOKEN_TTL });
      const accessToken = jwt.sign({ email, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

      await DBService.createSession(user.id, sessionToken);
      return { user, sessionToken, accessToken };
    } catch (error) {
      if (error instanceof HttpError) {
        throw new HttpError(error.httpCode, error.message );
      } else {
        throw new HttpError(500, "INTERNAL_SERVER_ERROR");
      };
      // console.log(error);
    }
  }

  async refreshAccess(sessionToken: string) {
    try {
      const checkedToken=checkToken(sessionToken);
      if (!checkedToken.expired || !checkedToken.valid){
        await DBService.deleteSessionByToken(sessionToken);
        throw new HttpError(401, "INVALID_TOKEN");
      }
      const user = await DBService.findUserByEmail(checkedToken.email);
      if (!user) throw new BadRequestError("BAD_REQUEST!");
      const accessToken = jwt.sign({ email:user.email, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
      return accessToken
      
    } catch (error) {
      console.log(error);
      throw new HttpError(500, "INTERNAL_SERVER_ERROR");
    }
  };

  async sendRemind(email: string) {
    try {
      const user = await DBService.findUserByEmail(email);
      if (!user) {
        throw new HttpError(401, "INVALID_EMAIL_OR_PASSWORD");
      }
      if (!user.verified) {
        throw new HttpError(418, "EMAIL_NOT_VERIFIED");
      }
      const payload = { email: user.email };
      const verificationToken = jwt.sign(payload, SESSION_SECRET, { expiresIn: VERIFICATION_TOKEN_TTL });
      await DBService.createSession(user.id, verificationToken );

      await mailService.sendResetURL(email, verificationToken)
    } catch (error) {
      if (error instanceof HttpError) {
        throw new HttpError(error.httpCode, error.message );
      } else {
        throw new HttpError(500, "INTERNAL_SERVER_ERROR");
      };
    }
  };
}

export default new AuthService();
