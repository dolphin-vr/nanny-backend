import { ApiError } from "./ApiError";

export function isApiError(error: any): error is ApiError {
  return error && typeof error === "object" && "status" in error && "code" in error && "message" in error;
}
