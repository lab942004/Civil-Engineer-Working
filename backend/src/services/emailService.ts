import nodemailer from 'nodemailer';
import { config } from '../config';

interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  success: boolean;
  provider?: 'brevo-api' | 'smtp';
  id?: string;
  error?: string;
}

class EmailService {
  private brevoApiKey: string;
  private smtpTransporter: nodemailer.Transporter | null = null;

  constructor() {
    this.brevoApiKey = process.env.BREVO_API_KEY || '';
  }

  private getSmtpTransport(): nodemailer.Transporter {
    if (!this.smtpTransporter) {
      this.smtpTransporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        requireTLS: true,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      } as nodemailer.TransportOptions);
    }

    return this.smtpTransporter;
  }

  private getFromAddress(): string {
    if (config.smtp.from && config.smtp.from.includes('@')) {
      return config.smtp.fromName
        ? `"${config.smtp.fromName}" <${config.smtp.from}>`
        : config.smtp.from;
    }

    return config.smtp.user ? `"${config.smtp.fromName}" <${config.smtp.user}>` : 'Civil Engineer Assistant <noreply@yourdomain.com>';
  }

  private async sendViaBrevoApi({ to, subject, html, text }: SendEmailArgs): Promise<SendEmailResult> {
    if (!this.brevoApiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const recipients = Array.isArray(to) ? to : [to];
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': this.brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: config.smtp.fromName || 'Civil Engineer Assistant',
          email: config.smtp.from || config.smtp.user || 'noreply@yourdomain.com',
        },
        to: recipients.map((email) => ({ email })),
        subject,
        htmlContent: html,
        textContent: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { message?: string; messageId?: string };

    if (!response.ok) {
      throw new Error(data.message || 'Brevo API request failed');
    }

    return {
      success: true,
      provider: 'brevo-api',
      id: data.messageId,
    };
  }

  private async sendViaSmtp({ to, subject, html, text }: SendEmailArgs): Promise<SendEmailResult> {
    const recipients = Array.isArray(to) ? to : [to];
    const transport = this.getSmtpTransport();
    const info = await transport.sendMail({
      from: this.getFromAddress(),
      to: recipients.join(', '),
      subject,
      html,
      text,
    });

    return {
      success: true,
      provider: 'smtp',
      id: info.messageId,
    };
  }

  async send(args: SendEmailArgs): Promise<SendEmailResult> {
    if (this.brevoApiKey) {
      try {
        return await this.sendViaBrevoApi(args);
      } catch (err: any) {
        console.error('[email] Brevo API failed:', err.message);
      }
    }

    if (config.smtp.user && config.smtp.pass) {
      try {
        return await this.sendViaSmtp(args);
      } catch (err: any) {
        console.error('[email] SMTP failed:', err.message);
        throw new Error(`SMTP failed: ${err.message}`);
      }
    }

    throw new Error('No email provider configured');
  }

  async sendOtpEmail(to: string, name: string, otp: string, expiryMinutes: number) {
    const subject = 'Verify your email — Civil Engineer Assistant';
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #ea580c, #c2410c); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Civil Engineer Assistant</h1>
        </div>
        <div style="padding: 28px;">
          <p style="font-size: 15px; color: #111827; margin-bottom: 10px;">Hi ${escapeHtml(name)},</p>
          <p style="font-size: 15px; color: #374151; line-height: 1.6;">Use the code below to verify your email address. This code expires in ${expiryMinutes} minutes.</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 34px; letter-spacing: 10px; font-weight: 700; color: #ea580c; background: #fff7ed; padding: 16px 24px; border-radius: 10px;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #6b7280;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `;
    const text = `Hi ${name},\n\nYour verification code is: ${otp}\n\nThis code expires in ${expiryMinutes} minutes.`;

    return this.send({ to, subject, html, text });
  }

  async sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
    const subject = 'Reset your password — Civil Engineer Assistant';
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #ea580c, #c2410c); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Civil Engineer Assistant</h1>
        </div>
        <div style="padding: 28px;">
          <p style="font-size: 15px; color: #111827; margin-bottom: 10px;">Hi ${escapeHtml(name)},</p>
          <p style="font-size: 15px; color: #374151; line-height: 1.6;">We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 8px; font-weight: 600;">Reset Password</a>
          </div>
          <p style="font-size: 13px; color: #6b7280;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `;
    const text = `Hi ${name},\n\nReset your password using this link: ${resetUrl}\n\nThis link expires in 1 hour.`;

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

const baseStyle = `
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:20px}
  .wrapper{max-width:520px;margin:0 auto}
  .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{
    background:linear-gradient(135deg,#ea580c,#c2410c);
    padding:28px 32px;
    text-align:center;
  }
  .header h1{
    color:#fff;
    font-size:22px;
    font-weight:700;
  }
  .header p{
    color:rgba(255,255,255,.9);
    font-size:13px;
    margin-top:4px;
  }
  .body{
    padding:32px;
  }
  .body h2{
    color:#1e293b;
    font-size:20px;
    margin-bottom:10px;
  }
  .body p{
    color:#475569;
    font-size:14px;
    line-height:1.7;
    margin-bottom:14px;
  }
  .info-card{
    background:#fff7ed;
    border-left:5px solid #ea580c;
    border-radius:10px;
    padding:18px;
    margin:20px 0;
  }
  .info-card p{
    margin-bottom:8px;
    color:#334155;
  }
  .btn{
    display:inline-block;
    background:#ea580c;
    color:#fff;
    text-decoration:none;
    padding:12px 28px;
    border-radius:8px;
    font-weight:600;
    margin-top:18px;
  }
  .divider{
    height:1px;
    background:#e2e8f0;
    margin:20px 0;
  }
  .footer{
    background:#f1f5f9;
    padding:18px;
    text-align:center;
    font-size:11px;
    color:#94a3b8;
  }
</style>
`;

const projectInquiryTemplate = (
  clientName: string,
  projectTitle: string,
  location: string,
  service: string,
  budget: string
) => ({
  subject: `🏗️ New Project Inquiry - ${projectTitle}`,

  html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${baseStyle}
</head>

<body>

<div class="wrapper">

<div class="card">

<div class="header">
<h1>🏗️ Civil Engineering Services</h1>
<p>Professional Engineering & Construction Solutions</p>
</div>

<div class="body">

<h2>Hello Engineer, 👋</h2>

<p>
You have received a new project inquiry from
<strong>${clientName}</strong>.
</p>

<div class="info-card">

<p><strong>📌 Project:</strong> ${projectTitle}</p>

<p><strong>📍 Location:</strong> ${location}</p>

<p><strong>🛠️ Required Service:</strong> ${service}</p>

<p><strong>💰 Estimated Budget:</strong> ${budget}</p>

</div>

<p>
Please log in to your dashboard to review the inquiry and contact the client.
</p>

<a href="#" class="btn">
View Project
</a>

<div class="divider"></div>

<p style="font-size:12px;color:#94a3b8;">
You are receiving this email because you're registered as a Civil Engineering professional.
</p>

</div>

<div class="footer">
Civil Engineering Services © 2026
<br>
Design • Planning • Construction • Consultancy
</div>

</div>

</div>

</body>
</html>
`
});

const projectApprovedTemplate = (
  clientName: string,
  projectTitle: string,
  engineerName: string
) => ({

subject: "✅ Project Accepted",

html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${baseStyle}
</head>

<body>

<div class="wrapper">

<div class="card">

<div class="header">
<h1>🏗️ Civil Engineering Services</h1>
<p>Project Status Update</p>
</div>

<div class="body">

<h2>Hello ${clientName},</h2>

<p>
Great news!
</p>

<p>
Your project
<strong>${projectTitle}</strong>
has been accepted by
<strong>${engineerName}</strong>.
</p>

<div class="info-card">

<p>✅ Status: Accepted</p>

<p>👷 Engineer: ${engineerName}</p>

</div>

<p>
Our engineer will contact you shortly to discuss project planning and execution.
</p>

<a href="#" class="btn">
Open Dashboard
</a>

</div>

<div class="footer">
Civil Engineering Services © 2026
</div>

</div>

</div>

</body>
</html>
`
});

const projectRejectedTemplate = (
clientName: string,
projectTitle: string
)=>({

subject:"❌ Project Update",

html:`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${baseStyle}
</head>

<body>

<div class="wrapper">

<div class="card">

<div class="header">
<h1>🏗️ Civil Engineering Services</h1>
<p>Project Status Update</p>
</div>

<div class="body">

<h2>Hello ${clientName},</h2>

<p>
Unfortunately, your project request
<strong>${projectTitle}</strong>
could not be accepted at this time.
</p>

<div class="info-card">

<p>❌ Status: Not Accepted</p>

</div>

<p>
You can submit another request or explore other available engineering professionals.
</p>

<a href="#" class="btn">
Find Engineers
</a>

</div>

<div class="footer">
Civil Engineering Services © 2026
</div>

</div>

</div>

</body>
</html>
`
});

const otpTemplate = (name: string, otp: string) => ({

subject: "🔐 Verify Your Email",

html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${baseStyle}
</head>

<body>

<div class="wrapper">

<div class="card">

<div class="header">
<h1>🏗️ Civil Engineering Services</h1>
<p>Secure Verification</p>
</div>

<div class="body">

<h2>Hello ${name}, 👋</h2>

<p>
Use the verification code below to verify your email address.
</p>

<div style="
background:#fff7ed;
border:2px dashed #ea580c;
border-radius:12px;
padding:24px;
text-align:center;
margin:25px 0;
">

<div style="
font-size:42px;
font-weight:bold;
letter-spacing:12px;
color:#ea580c;
font-family:monospace;
">
${otp}
</div>

<p style="margin-top:10px;color:#94a3b8;font-size:12px;">
Valid for 5 minutes
</p>

</div>

<p style="font-size:12px;color:#94a3b8;">
If you didn't request this verification, simply ignore this email.
</p>

</div>

<div class="footer">
Civil Engineering Services © 2026
</div>

</div>

</div>

</body>
</html>
`
});

