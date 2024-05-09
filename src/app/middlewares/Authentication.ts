import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "helpers/ApiError";
import { ExpressMiddlewareInterface } from "routing-controllers";
import { IJwtPayload, IRequest } from "types/extended";

const prisma = new PrismaClient();
const ACCESS_SECRET: string = process.env.ACCESS_SECRET as string;

export class Authentication implements ExpressMiddlewareInterface {
  async use(req: IRequest, res: Response, next: NextFunction) {
    const { authorization } = req.headers;
    if (!authorization) {
      return new ApiError(401, { code: "AUTH_HEADER_NOT_FOUND", message: "Authorization header not found" });
    }
    const [bearer, token] = authorization.split(" ");
    if (bearer !== "Bearer") {
      return new ApiError(401, { code: "AUTH_TYPE_MISMATCH", message: "Authorization type mismatch" });
    }
    try {
      const { id, role } = jwt.verify(token, ACCESS_SECRET) as IJwtPayload;
      const user = await prisma.user.findFirst({ where: { id, role } });
      if (!user || !user.accessToken || user.accessToken !== token) {
        return new ApiError(401, { code: "USER_NOT_AUTHORIZED", message: "User not authorized" });
      }
      req.user = user;
      next();
    } catch (error) {
      return new ApiError(401, { code: "USER_NOT_AUTHORIZED", message: "User not authorized" });
    }
  }
}
