import { Length, IsEmail, IsString } from "class-validator";
// import type { ISignin } from "types/Auth.types";

export class SigninDto {
  @IsEmail({}, { message: "Provided Email is not valid" })
  public email: string = "";

  @IsString()
  @Length(7, 48, { message: "Password should be from 7 to 48 characters" })
  public password: string = "";
}