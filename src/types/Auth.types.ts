export interface ISignup {
  username: string;
  email: string;
  password: string;
}

export interface ISignin {
  email: string;
  password: string;
}

export interface IPasswdRemind {
  email: string;
}

export interface IPasswdReset {
  password: string;
  token: string;
}
