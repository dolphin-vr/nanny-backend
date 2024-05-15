import AuthController from "./controllers/AuthController";
import NannyController from "./controllers/NannyController";
import UsersController from "./controllers/UsersController";
// type Controller = typeof Signup;
// const controllers = <Controller[]>[Signup, UsersDelete];
const controllers = [AuthController, UsersController, NannyController];

export { controllers };
