import { HTTPRequestLogger } from "./HTTPRequestLogger";
import { HTTPResponseLogger } from "./HTTPResponseLogger";
import { Authentication } from "./Authentication";
export { AuthChecker } from "./AuthChecker";
export { currentUser } from "./currentUser"

type Middleware = typeof HTTPRequestLogger | typeof HTTPResponseLogger; // list all middlewares????????????
const middlewares = <Middleware[]>[HTTPRequestLogger, HTTPResponseLogger, Authentication, ];

export { middlewares };
