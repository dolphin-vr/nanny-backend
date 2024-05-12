import crypto from "crypto";
// import { env } from 'process';

const { SESSION_SECRET = "" } = process.env;

export const random = () => crypto.randomBytes(128).toString("base64");
export const hashPassword = (salt: string, password: string) => {
  return crypto.createHmac("sha256", [salt, password].join("/")).update(SESSION_SECRET).digest("hex");
};
