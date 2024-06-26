import { IsEmail } from "class-validator";
// import type { IPasswdRemind } from "types/Auth.types";

export class PasswdRemindDto {
  @IsEmail({}, { message: "Provided Email is not valid" })
  public email: string = "";
}
