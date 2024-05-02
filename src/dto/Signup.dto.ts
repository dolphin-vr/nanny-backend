import { Length, IsEmail } from "class-validator";
import type { ISignup } from "types/Auth.types";

export class SignupDto implements ISignup {
  @Length(3, 21)
  username: string = "";

  @IsEmail()
  email: string = "";

  @Length(7, 48)
  password: string = "";
}