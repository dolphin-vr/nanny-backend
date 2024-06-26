import crypto from "crypto";

const SESSION_SECRET: string = process.env.SESSION_SECRET as string;

export const random = () => crypto.randomBytes(128).toString("base64");
export const hashPassword = (salt: string, password: string) => {
  return crypto.createHmac("sha256", [salt, password].join("/")).update(SESSION_SECRET).digest("hex");
};
