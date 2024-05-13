import nodemailer from "nodemailer";
import { Options } from "nodemailer/lib/smtp-connection";
import { IEmail } from "types/IEmail";

const { MAIL_HOST, MAIL_PORT = "587", MAIL_USER, MAIL_PASSWD, MAIL_FROM } = process.env;

const nodemailerConfig: Options = {
  host: MAIL_HOST,
  port: parseInt(MAIL_PORT),
  // secure: false,
  secure: MAIL_PORT === "465" ? true : false,
  // tls: {
  //   ciphers: "SSLv3",
  //   minVersion: "TLSv1.2",
  // },
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASSWD,
  },
};
const transport = nodemailer.createTransport(nodemailerConfig);

export const sendEmail = (data: IEmail) => {
  // console.log("opt-mail= ", nodemailerConfig);
  const email = { ...data, from: MAIL_FROM };
  return transport.sendMail(email);
};
