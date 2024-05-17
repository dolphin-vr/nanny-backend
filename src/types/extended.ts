import { User } from "@prisma/client";
import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface IJwtPayload extends JwtPayload {
  id?: number;
  email?: string;
  role?: string;
}

export interface IRequest extends Request {
  user: User;
}
