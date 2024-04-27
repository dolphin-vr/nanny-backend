import crypto from 'crypto';
import { env } from 'process';

const { JWT_SECRET = "" } = process.env;

export const random = () => crypto.randomBytes(128).toString('base64');
export const authentication = (salt: string, password: string) => {
	return crypto.createHmac("sha256", [salt, password].join("/")).update(JWT_SECRET).digest("hex");
}