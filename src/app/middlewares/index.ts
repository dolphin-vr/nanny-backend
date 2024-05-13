import { HTTPRequestLogger } from "./HTTPRequestLogger";
import { HTTPResponseLogger } from "./HTTPResponseLogger";
import { Authentication } from "./Authentication";
import { Authorization } from "./Authorization";

type Middleware = typeof HTTPRequestLogger | typeof HTTPResponseLogger;  // list all middlewares????????????
const middlewares = <Middleware[]>[HTTPRequestLogger, HTTPResponseLogger, Authentication, Authorization];

export { middlewares };
