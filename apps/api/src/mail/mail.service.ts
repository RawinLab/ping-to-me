import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_SERVER_HOST'),
      port: Number(this.configService.get('EMAIL_SERVER_PORT')),
      auth: {
        user: this.configService.get('EMAIL_SERVER_USER'),
        pass: this.configService.get('EMAIL_SERVER_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${this.configService.get('NEXTAUTH_URL')}/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: email,
      subject: 'Verify your email for PingTO.Me',
      text: `Verify your email\n${url}\n\n`,
      html: `<p>Verify your email</p><p><a href="${url}">Click here to verify your email</a></p>`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const url = `${this.configService.get('NEXTAUTH_URL')}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: email,
      subject: 'Reset your password',
      text: `Reset your password\n${url}\n\n`,
      html: `<p>Reset your password</p><p><a href="${url}">Click here to reset your password</a></p>`,
    });
  }
}
