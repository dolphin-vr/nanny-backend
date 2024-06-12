import { HttpError } from "routing-controllers";
import type { ValidationError } from "class-validator";
interface MessageInterface {
  status: number;
  message?: string;
  code?: string;
  errors?: ValidationError[];
}
export class ApiError extends HttpError {
  // public status: number;
  public error: MessageInterface;
  // public removeLog: boolean;

  constructor(status = 500, error: Omit<MessageInterface, "status">) {
  // constructor(status: number, error: Omit<MessageInterface, "status">) {
    super(status);
    // this.status = status;
    this.error = { ...error, status, code: error.code || "INTERNAL_ERROR" };
    this.name = "ApiError";
    this.message = error.message || "";
  }

  public toJSON = (): MessageInterface => {
    return this.error;
  };
}

// export class ApiError extends Error {
//   status: number;
//   code: string;
//   message: string;

//   constructor(status: number, { code, message }: { code: string; message: string }) {
//     super(message);
//     this.status = status;
//     this.code = code;
//     this.message = message;
//     Object.setPrototypeOf(this, new.target.prototype);
//   }

//   toJSON() {
//     return {
//       name: this.name,
//       message: this.message,
//       status: this.status,
//       code: this.code,
//     };
//   }
// }
