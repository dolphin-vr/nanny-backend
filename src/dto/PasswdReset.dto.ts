import { IsJWT, Length } from "class-validator";
import type { IPasswdReset } from "types/Auth.types";

export class PasswdResetDto implements IPasswdReset {
  @Length(7, 48)
  password: string = "";

  @IsJWT()
  token: string = "";
}
