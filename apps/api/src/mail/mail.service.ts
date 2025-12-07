import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get("EMAIL_SERVER_HOST"),
      port: Number(this.configService.get("EMAIL_SERVER_PORT")),
      auth: {
        user: this.configService.get("EMAIL_SERVER_USER"),
        pass: this.configService.get("EMAIL_SERVER_PASSWORD"),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${this.configService.get("NEXTAUTH_URL")}/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get("EMAIL_FROM"),
      to: email,
      subject: "Verify your email for PingTO.Me",
      text: `Verify your email\n${url}\n\n`,
      html: `<p>Verify your email</p><p><a href="${url}">Click here to verify your email</a></p>`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const url = `${this.configService.get("NEXTAUTH_URL")}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get("EMAIL_FROM"),
      to: email,
      subject: "Reset your password",
      text: `Reset your password\n${url}\n\n`,
      html: `<p>Reset your password</p><p><a href="${url}">Click here to reset your password</a></p>`,
    });
  }

  async sendInvitationEmail(params: {
    email: string;
    token: string;
    organizationName: string;
    inviterName: string;
    role: string;
    personalMessage?: string;
    expiresAt: Date;
  }) {
    const appUrl = this.configService.get("NEXTAUTH_URL");
    const acceptUrl = `${appUrl}/invitations/${params.token}`;
    const declineUrl = `${appUrl}/invitations/${params.token}?action=decline`;

    const expiryDate = params.expiresAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const textContent = `
You've been invited to join ${params.organizationName}!

${params.inviterName} has invited you to join ${params.organizationName} as a ${params.role}.

${params.personalMessage ? `Personal message from ${params.inviterName}:\n"${params.personalMessage}"\n\n` : ""}

Accept invitation: ${acceptUrl}
Decline invitation: ${declineUrl}

This invitation expires on ${expiryDate}.

---
PingTO.Me - URL Shortener Platform
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .message-box { background-color: #fff; padding: 15px; margin: 20px 0; border-left: 4px solid #4F46E5; }
    .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .button-primary { background-color: #4F46E5; color: white; }
    .button-secondary { background-color: #6B7280; color: white; }
    .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 12px; }
    .role-badge { display: inline-block; padding: 4px 12px; background-color: #DBEAFE; color: #1E40AF; border-radius: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're Invited!</h1>
    </div>
    <div class="content">
      <p><strong>${params.inviterName}</strong> has invited you to join <strong>${params.organizationName}</strong> on PingTO.Me.</p>

      <p>You've been invited as: <span class="role-badge">${params.role}</span></p>

      ${
        params.personalMessage
          ? `
        <div class="message-box">
          <p><strong>Personal message from ${params.inviterName}:</strong></p>
          <p>"${params.personalMessage}"</p>
        </div>
      `
          : ""
      }

      <div style="text-align: center; margin: 30px 0;">
        <a href="${acceptUrl}" class="button button-primary">Accept Invitation</a>
        <a href="${declineUrl}" class="button button-secondary">Decline</a>
      </div>

      <p style="color: #6B7280; font-size: 14px;">
        This invitation expires on <strong>${expiryDate}</strong>.
      </p>
    </div>
    <div class="footer">
      <p>PingTO.Me - URL Shortener Platform</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    await this.transporter.sendMail({
      from: this.configService.get("EMAIL_FROM"),
      to: params.email,
      subject: `You're invited to join ${params.organizationName} on PingTO.Me`,
      text: textContent,
      html: htmlContent,
    });
  }
}
