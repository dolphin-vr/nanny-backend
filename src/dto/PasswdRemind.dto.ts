import { IsEmail } from "class-validator";
import type { IPasswdRemind } from "types/Auth.types";

export class PasswdRemindDto implements IPasswdRemind {
  @IsEmail()
  email: string = "";
}
