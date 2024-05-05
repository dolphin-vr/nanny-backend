import AuthController from "./controllers/AuthController";
import UsersController from "./controllers/UsersController";
// type Controller = typeof Signup;
// const controllers = <Controller[]>[Signup, UsersDelete];
const controllers = [AuthController, UsersController];

export { controllers };
