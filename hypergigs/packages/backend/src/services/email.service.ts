import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TeamInvitationEmailParams {
  to: string;
  teamName: string;
  inviterName: string;
  role: string;
  message?: string;
  token: string;
  teamAvatar?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send team invitation email to non-registered user
   */
  async sendTeamInvitation(params: TeamInvitationEmailParams): Promise<void> {
    const {
      to,
      teamName,
      inviterName,
      role,
      message,
      token,
      teamAvatar,
    } = params;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const invitationUrl = `${frontendUrl}/join/${token}`;

    try {
      // Load HTML template
      const htmlTemplate = this.renderTeamInvitationHtml({
        teamName,
        inviterName,
        role,
        message,
        invitationUrl,
        teamAvatar,
      });

      // Load text template
      const textTemplate = this.renderTeamInvitationText({
        teamName,
        inviterName,
        role,
        message,
        invitationUrl,
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || `"HyperGigs" <${process.env.SMTP_USER}>`,
        to,
        subject: `${inviterName} invited you to join ${teamName} on HyperGigs`,
        text: textTemplate,
        html: htmlTemplate,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Team invitation email sent to ${to} for team ${teamName}`);
    } catch (error) {
      logger.error('Failed to send team invitation email:', error);
      throw new Error('Failed to send invitation email');
    }
  }

  /**
   * Render HTML email template for team invitation
   */
  private renderTeamInvitationHtml(data: {
    teamName: string;
    inviterName: string;
    role: string;
    message?: string;
    invitationUrl: string;
    teamAvatar?: string;
  }): string {
    const { teamName, inviterName, role, message, invitationUrl, teamAvatar } =
      data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .team-info {
      text-align: center;
      margin: 30px 0;
    }
    .team-avatar {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      margin: 0 auto 15px;
      object-fit: cover;
    }
    .team-name {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 10px 0;
    }
    .invitation-details {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #6c757d;
    }
    .detail-value {
      color: #1a1a1a;
    }
    .personal-message {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      font-style: italic;
      color: #856404;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
    .expiration-notice {
      color: #6c757d;
      font-size: 14px;
      text-align: center;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 You're Invited!</h1>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #6c757d; text-align: center;">
        <strong>${inviterName}</strong> has invited you to join their team on HyperGigs
      </p>

      <div class="team-info">
        ${
          teamAvatar
            ? `<img src="${teamAvatar}" alt="${teamName}" class="team-avatar">`
            : '<div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold;">${teamName[0]}</div>'
        }
        <div class="team-name">${teamName}</div>
      </div>

      <div class="invitation-details">
        <div class="detail-row">
          <span class="detail-label">Invited by:</span>
          <span class="detail-value">${inviterName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Role:</span>
          <span class="detail-value">${role === 'ADMIN' ? 'Admin' : 'Member'}</span>
        </div>
      </div>

      ${
        message
          ? `<div class="personal-message">"${message}"</div>`
          : ''
      }

      <p style="font-size: 16px; margin: 25px 0;">
        Click the button below to create your HyperGigs profile and join the team:
      </p>

      <div class="cta-container">
        <a href="${invitationUrl}" class="cta-button">
          Accept Invitation & Create Profile →
        </a>
      </div>

      <p class="expiration-notice">
        This invitation will expire in 7 days.
      </p>

      <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>

    <div class="footer">
      <p>
        © ${new Date().getFullYear()} HyperGigs. All rights reserved.
      </p>
      <p style="margin-top: 10px;">
        This email was sent to you because ${inviterName} invited you to join ${teamName}.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Render plain text email template for team invitation
   */
  private renderTeamInvitationText(data: {
    teamName: string;
    inviterName: string;
    role: string;
    message?: string;
    invitationUrl: string;
  }): string {
    const { teamName, inviterName, role, message, invitationUrl } = data;

    return `
🎉 You're Invited to Join ${teamName}!

${inviterName} has invited you to join their team on HyperGigs.

INVITATION DETAILS:
-------------------
Team: ${teamName}
Invited by: ${inviterName}
Role: ${role === 'ADMIN' ? 'Admin' : 'Member'}

${message ? `\nPersonal Message:\n"${message}"\n` : ''}

To accept this invitation and create your HyperGigs profile, click the link below:

${invitationUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
© ${new Date().getFullYear()} HyperGigs. All rights reserved.
This email was sent to you because ${inviterName} invited you to join ${teamName}.
    `.trim();
  }

  /**
   * Verify email transporter connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
