import { ExpressErrorMiddlewareInterface, Middleware } from "routing-controllers";
import { NextFunction, Request, Response } from "express";
import { HttpError } from "routing-controllers";

@Middleware({ type: "after" })
export class CusErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: any, request: Request, response: Response, next: NextFunction): void {
		if (response.headersSent) {
			console.log('=== MdWare: resp was sent ===')
      return next(error);
    }

    if (error instanceof HttpError) {
			console.log("=== MdWare: error instanceof HttpError ===");
      const { stack, ...errorWithoutStack } = error;
      response.status(error.httpCode || 500).json({
        ...errorWithoutStack,
        message: error.message,
      });
    } else {
      response.status(500).json({
        name: error.name,
        message: error.message,
      });
    }
  }
}
