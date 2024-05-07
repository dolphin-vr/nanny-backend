export enum Role {
  USER = "USER",
  NANNY = "NANNY",
  MANAGER = "MANAGER",
  ADMIN = "ADMIN",
}

export interface IUser {
  id: number;
  email: String;
  username: String | null;
  password: String;
  salt: String;
  sessionToken: String | null;
  accessToken: String | null;
  avatar: String | null;
  role: Role;
  verified: Boolean;
  theme: String;
}
