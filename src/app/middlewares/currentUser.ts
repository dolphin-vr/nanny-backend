import { Action } from "routing-controllers";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { IJwtPayload } from "types/extended";
import dbServises from "../../services/dbApi";
import { ApiError } from "helpers";

const ACCESS_SECRET: string = process.env.ACCESS_SECRET as string;

export const currentUser = async (action: Action): Promise<User | null> => {
  try {
    const { token } = action.request.headers.authorization.split(" ");
    const { id } = jwt.verify(token, ACCESS_SECRET) as IJwtPayload;
    return await dbServises.findUserById(id);
  } catch (error) {
    throw new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
  }
};
