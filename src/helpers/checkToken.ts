import jwt, { JwtPayload } from "jsonwebtoken";
import { IJwtPayload } from "types/extended";

const SESSION_SECRET: string = process.env.SESSION_SECRET as string;

interface TokenCheckResult {
  valid: boolean;
  expired: boolean;
  email: string | undefined;
}

export const checkToken = (token: string): TokenCheckResult => {
  try {
    const { email } = jwt.verify(token, SESSION_SECRET) as IJwtPayload;
    console.log("Токен дійсний:", email);
    return { valid: true, expired: false, email };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log("Токен прострочений");
      return { valid: false, expired: true, email: undefined };
    }
    console.log("Токен недійсний");
    return { valid: false, expired: false, email: undefined };
  }
};

// Приклад використання
// const result = checkToken(token);
