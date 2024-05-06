import { Length, IsEmail } from "class-validator";
import type { ISignin } from "types/Auth.types";

export class SigninDto implements ISignin {
  @IsEmail()
  email: string = "";

  @Length(7, 48)
  password: string = "";
}