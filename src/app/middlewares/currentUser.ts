import { Action } from "routing-controllers";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { IJwtPayload } from "types/extended";

const ACCESS_SECRET: string = process.env.ACCESS_SECRET as string;

export const currentUser = async (action: Action) => {
	try {
  const { token } = action.request.headers.authorization.split(" ");
      const { id } = jwt.verify(token, ACCESS_SECRET) as IJwtPayload;
		
	} catch (error) {
		
	}
};
