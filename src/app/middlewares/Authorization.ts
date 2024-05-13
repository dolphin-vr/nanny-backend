import { NextFunction, Response } from "express";
import { ExpressMiddlewareInterface } from "routing-controllers";
import { IRequest } from "types/extended";
import { ApiError } from "../../helpers";

export class Authorization implements ExpressMiddlewareInterface {
  constructor(public roles: String[]) {}
	use(req: IRequest, res: Response, next: NextFunction) {
		if (!req.user) return new ApiError(401, { code: "USER_NOT_AUTHORIZED", message: "User not authorized" });
		const allowed = this.roles.includes(req.user.role);
		if (!allowed) return new ApiError(403, { code: "FORBIDDEN", message: "Forbidden" });
		next()
	};
}