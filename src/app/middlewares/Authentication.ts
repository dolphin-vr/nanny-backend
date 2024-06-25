import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ExpressMiddlewareInterface } from "routing-controllers";
import { IJwtPayload, IRequest } from "types/extended";
import { ApiError } from "../../helpers";

const prisma = new PrismaClient();
const ACCESS_SECRET: string = process.env.ACCESS_SECRET as string;

export class Authentication implements ExpressMiddlewareInterface {
  async use(req: IRequest, res: Response, next: NextFunction) {
    console.log("step 1")
    const { authorization } = req.headers;
    console.log("step 2");
    if (!authorization) {
    console.log("error 1");
      throw new ApiError(401, { code: "AUTH_HEADER_NOT_FOUND", message: "Authorization header not found" });
    }
    console.log("step 3");
    const [bearer, token] = authorization.split(" ");
    console.log("step 4");
    if (bearer !== "Bearer") {
    console.log("error 2");
      throw new ApiError(401, { code: "AUTH_TYPE_MISMATCH", message: "Authorization type mismatch" });
    }
    try {
    console.log("step 5");
      const { id } = jwt.verify(token, ACCESS_SECRET) as IJwtPayload;
      const user = await prisma.user.findFirst({ where: { id } });
    console.log("step 6");
      // const session = await prisma.session.findFirst({ where: { user_id: id, sessionToken: token } });
      if (!user) {
    console.log("error 3");
        throw new ApiError(401, { code: "USER_NOT_AUTHORIZED", message: "User not authorized" });
      }
    console.log("step 7");
      req.user = user;
      next();
    } catch (error) {
    console.log("error 4");
      throw new ApiError(401, { code: "USER_NOT_AUTHORIZED", message: "User not authorized" });
    }
  }
}
