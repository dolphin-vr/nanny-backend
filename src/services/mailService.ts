import nodemailer, { Transporter } from "nodemailer";
import { Options } from "nodemailer/lib/smtp-connection";
// import { Email } from "types/IEmail";

const { MAIL_HOST, MAIL_PORT = "587", MAIL_USER, MAIL_PASSWD, MAIL_FROM, APP_URL } = process.env;

const nodemailerConfig: Options = {
  host: MAIL_HOST,
  port: parseInt(MAIL_PORT),
  // secure: false,
  secure: MAIL_PORT === "465" ? true : false,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASSWD,
  },
};

class mailService {
  transport: Transporter;

  constructor() {
    this.transport = nodemailer.createTransport(nodemailerConfig);
  }

  async sendActivationEmail(email: string, verificationToken: string) {
    const verificationEmail = {
      from: MAIL_FROM,
      to: email,
      subject: "NannyService activation email",
      html: `
				<div>
					<h1>Thank you for registering!</h1>
					<p>Click URL below to activate your account</p>
					<a href="${APP_URL}/verify/${verificationToken}" target="_blank">${APP_URL}/verify/${verificationToken}</a>
				</div>`,
    };
    // const email = { ...data, from: MAIL_FROM };
    return await this.transport.sendMail(verificationEmail);
  }
}

export default new mailService();
