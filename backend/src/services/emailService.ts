import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { config } from '../config';

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Email delivery with automatic failover.
 *
 * Primary  -> Resend (fast, good deliverability, simple REST API)
 * Fallback -> SMTP via Nodemailer (used if Resend isn't configured, or if
 *             the Resend API call throws/fails for any reason)
 *
 * This means the app keeps working even if only one of the two providers
 * is configured, and a transient Resend outage doesn't block OTP delivery.
 */
class EmailService {
  private resend: Resend | null = null;
  private smtpTransporter: nodemailer.Transporter | null = null;

  constructor() {
    if (config.resend.apiKey) {
      this.resend = new Resend(config.resend.apiKey);
    }

    if (config.smtp.user && config.smtp.pass) {
      this.smtpTransporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure, // true for 465, false for other ports (STARTTLS)
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    }
  }

  private async sendViaResend({ to, subject, html, text }: SendEmailArgs): Promise<void> {
    if (!this.resend) throw new Error('Resend is not configured');

    const { error } = await this.resend.emails.send({
      from: `${config.resend.fromName} <${config.resend.from}>`,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
    }
  }

  private async sendViaSmtp({ to, subject, html, text }: SendEmailArgs): Promise<void> {
    if (!this.smtpTransporter) throw new Error('SMTP is not configured');

    await this.smtpTransporter.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.from}>`,
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Tries Resend first. If Resend is unavailable/unconfigured or the send
   * throws, automatically falls back to SMTP. Throws only if BOTH fail
   * (or neither is configured), so callers can decide how to react.
   */
  async send(args: SendEmailArgs): Promise<{ provider: 'resend' | 'smtp' }> {
    const errors: string[] = [];

    if (this.resend) {
      try {
        await this.sendViaResend(args);
        return { provider: 'resend' };
      } catch (err: any) {
        errors.push(`Resend failed: ${err.message}`);
        console.warn(`[email] Resend send failed, falling back to SMTP: ${err.message}`);
      }
    }

    if (this.smtpTransporter) {
      try {
        await this.sendViaSmtp(args);
        return { provider: 'smtp' };
      } catch (err: any) {
        errors.push(`SMTP failed: ${err.message}`);
      }
    }

    if (!this.resend && !this.smtpTransporter) {
      // Neither provider configured. Don't crash the request in
      // development — just log the email so the flow is still testable.
      console.warn(
        '[email] No email provider configured (RESEND_API_KEY / SMTP_USER+SMTP_PASS missing). ' +
          `Email NOT sent. Subject: "${args.subject}" To: ${args.to}`
      );
      if (config.nodeEnv !== 'production') {
        console.warn(`[email] (dev preview) ${args.text}`);
        return { provider: 'smtp' };
      }
    }

    throw new Error(`Failed to send email via any provider: ${errors.join(' | ')}`);
  }

  async sendOtpEmail(to: string, name: string, otp: string, expiryMinutes: number) {
    const subject = 'Verify your email — Civil Engineer Assistant';
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Civil Engineer Assistant</h1>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 15px; color: #111827;">Hi ${escapeHtml(name)},</p>
          <p style="font-size: 15px; color: #374151;">Use the code below to verify your email address. This code expires in ${expiryMinutes} minutes.</p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="display: inline-block; font-size: 32px; letter-spacing: 10px; font-weight: 700; color: #1d4ed8; background: #eff6ff; padding: 16px 24px; border-radius: 10px;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #6b7280;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `;
    const text = `Hi ${name},\n\nYour Civil Engineer Assistant verification code is: ${otp}\n\nThis code expires in ${expiryMinutes} minutes. If you didn't request this, ignore this email.`;

    return this.send({ to, subject, html, text });
  }

  async sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
    const subject = 'Reset your password — Civil Engineer Assistant';
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Civil Engineer Assistant</h1>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 15px; color: #111827;">Hi ${escapeHtml(name)},</p>
          <p style="font-size: 15px; color: #374151;">We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #1d4ed8; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">Reset Password</a>
          </div>
          <p style="font-size: 13px; color: #6b7280;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `;
    const text = `Hi ${name},\n\nReset your password using this link: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`;

    return this.send({ to, subject, html, text });
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const emailService = new EmailService();
