import { Length, IsEmail, IsString } from "class-validator";
// import type { ISignup } from "types/Auth.types";

export class SignupDto {
  @IsString()
  @Length(3, 21, { message: "Username should be from 3 to 21 characters" })
  public username: string = "";

  @IsEmail({}, { message: "Provided Email is not valid" })
  email: string = "";

  @IsString()
  @Length(7, 48, { message: "Password should be from 7 to 48 characters" })
  password: string = "";
}
//  implements ISignup