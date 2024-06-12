import { NextFunction, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Action, ExpressMiddlewareInterface, UnauthorizedError } from "routing-controllers";
import jwt, { Jwt, JwtPayload, VerifyErrors } from "jsonwebtoken";
import { IJwtPayload, IRequest } from "types/extended";
import { ApiError } from "../../helpers";
import { DBService,  } from "../../services";

const prisma = new PrismaClient();
const ACCESS_SECRET: string = process.env.ACCESS_SECRET as string;

export const AuthChecker = async (action: Action, roles: String[]) => {
  // console.log("step 1");
  const authorization = action.request.headers["authorization"];

  // console.log("step 2");
  if (!authorization) {
    // console.log("error 1");
    throw new ApiError(401, { code: "AUTH_HEADER_NOT_FOUND", message: "Authorization header not found" });
  }

  // console.log("step 3");
  const [bearer, token] = authorization.split(" ");

  // console.log("step 4");
  if (bearer !== "Bearer") {
    // console.log("error 2");
    throw new ApiError(401, { code: "AUTH_TYPE_MISMATCH", message: "Authorization type mismatch" });
  }

  try {
    // console.log("step 5");
    // ===
    let jwtVerifyPromiseResolver: (tokenValid: boolean) => void;
    const jwtVerifyPromise = new Promise<boolean>(resolve => {
      jwtVerifyPromiseResolver = resolve;
    });

    jwt.verify(token, ACCESS_SECRET, { complete: true }, async (err: VerifyErrors | null, decoded: Jwt | undefined) => {
      let allowed = false;
      if (err || !decoded) {
        // console.log("jwt.verify err= ", err);
        // console.log("====");
        throw new ApiError(403, { code: "FORBIDDEN", message: "Forbidden" });
      }

      const { id } = decoded.payload as IJwtPayload;
      const user = await DBService.findUserById(id);
      if (!user) {
        // console.log("error 3");
        throw new ApiError(403, { code: "FORBIDDEN", message: "Forbidden" });
      }
      // console.log("step 6, user.role= ", user.role);
      // console.log("roles= ", roles);
      allowed = roles.includes(user.role);
      // console.log("allowed= ", allowed);
      jwtVerifyPromiseResolver(allowed);
    });

    // console.log("step 7, ");
    return jwtVerifyPromise;
    // ===
  } catch (error) {
    console.log("error 4");
    console.log("catch error= ", error);
    if (error instanceof ApiError) {
      console.log("instanceof= true");
      throw new ApiError(error.error.status, {  message: error.message }); // code: error.code,
    } else {
      console.log("instanceof= false");
      throw new ApiError(500, { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" });
    }

    // if (error instanceof ApiError) {
    //   throw new ApiError(error.error.status, { code: error.error.code, message: error.error.message });
    // } else if (isApiError(error)) {
    //   throw new ApiError(error.error.status, { code: error.error.code, message: error.error.message });
    // } else {
    //   throw new ApiError(500, { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" });
    // }

    // if (typeof error === Object){}
    // const httpCode = error.hasOwnProperty('httpCode')  ? error.httpCode: 400;
    // throw new HttpError(418, "signup oops"); // ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    // throw new HttpError(error);

    // throw new UnauthorizedError("oops") // ApiError(401, { code: "USER_NOT_AUTHORIZED", message: "User not authorized" });
  }
};
