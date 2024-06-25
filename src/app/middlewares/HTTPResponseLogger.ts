import { NextFunction, Request, Response } from "express";
import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";

@Middleware({ type: "after" })
export class HTTPResponseLogger implements ExpressMiddlewareInterface {
  use(req: Request, res: Response, next: NextFunction) {
    const { originalUrl, method } = req;
    const { statusCode } = res;
    console.log(`Received request: method=${method} path=${originalUrl} statusCode=${statusCode}`);
    next();
  }
}
