import { IsJWT, IsString, Length } from "class-validator";
import type { IPasswdReset } from "types/Auth.types";

export class PasswdResetDto {
  @IsString()
  @Length(7, 48, { message: "Password should be from 7 to 48 characters" })
  public password: string = "";

  @IsJWT({ message: "Invalid token" })
  token: string = "";
}
