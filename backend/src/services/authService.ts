import { prisma } from '../lib/prisma';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  generateOtp,
  hashOtp,
  compareOtp,
  verifyRefreshToken,
} from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';
import { emailService } from './emailService';
import { config } from '../config';

export class AuthService {
  async register(data: { name: string; email: string; password: string; role: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already registered', 400);

    const hashedPassword = await hashPassword(data.password);

    const otp = generateOtp(config.otp.length);
    const otpCodeHash = await hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role as any,
        otpCodeHash,
        otpExpiresAt,
        otpAttempts: 0,
        otpLastSentAt: new Date(),
      },
      select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true },
    });

    // Best-effort send in registration flow, but log the failure clearly so
    // SMTP/Brevo issues are visible during debugging.
    try {
      await emailService.sendOtpEmail(user.email, user.name, otp, config.otp.expiryMinutes);
    } catch (err: any) {
      console.error(`[auth] Failed to send OTP email to ${user.email}: ${err.message}`);
    }

    return user;
  }

  async verifyOtp(email: string, code: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Invalid email or code', 400);
    if (user.isVerified) throw new AppError('Email is already verified', 400);

    if (!user.otpCodeHash || !user.otpExpiresAt) {
      throw new AppError('No verification code found. Please request a new one.', 400);
    }

    if (user.otpExpiresAt < new Date()) {
      throw new AppError('Verification code has expired. Please request a new one.', 400);
    }

    if (user.otpAttempts >= config.otp.maxAttempts) {
      throw new AppError('Too many incorrect attempts. Please request a new code.', 429);
    }

    const isMatch = await compareOtp(code, user.otpCodeHash);
    if (!isMatch) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: { increment: 1 } },
      });
      throw new AppError('Invalid verification code', 400);
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id, user.email, user.role);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCodeHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        refreshToken,
      },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        phone: true, isVerified: true, createdAt: true,
      },
    });

    return { user: updated, accessToken, refreshToken };
  }

  async resendOtp(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Don't reveal whether the email exists.
    if (!user) return;
    if (user.isVerified) throw new AppError('Email is already verified', 400);

    if (user.otpLastSentAt) {
      const secondsSinceLast = (Date.now() - user.otpLastSentAt.getTime()) / 1000;
      if (secondsSinceLast < config.otp.resendCooldownSeconds) {
        const wait = Math.ceil(config.otp.resendCooldownSeconds - secondsSinceLast);
        throw new AppError(`Please wait ${wait}s before requesting another code.`, 429);
      }
    }

    const otp = generateOtp(config.otp.length);
    const otpCodeHash = await hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCodeHash, otpExpiresAt, otpAttempts: 0, otpLastSentAt: new Date() },
    });

    try {
      await emailService.sendOtpEmail(user.email, user.name, otp, config.otp.expiryMinutes);
    } catch (err: any) {
      console.error(`[auth] Failed to resend OTP email to ${user.email}: ${err.message}`);
      throw new AppError('We could not send the verification code right now. Please try again later.', 502);
    }
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Invalid email or password', 401);
    if (!user.isActive) throw new AppError('Account is deactivated', 403);

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw new AppError('Invalid email or password', 401);

    if (!user.isVerified) {
      // 403 + a distinct code lets the frontend route the user to the
      // OTP verification screen instead of showing a generic error.
      throw new AppError('Please verify your email before logging in.', 403, 'EMAIL_NOT_VERIFIED');
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id, user.email, user.role);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) throw new AppError('Refresh token is required', 400);

    // BUG FIX: the previous implementation only checked whether the token
    // string matched a row in the DB — it never actually verified the JWT
    // signature or expiry, so a refresh token issued 6 months ago (long
    // past its 30-day expiry) would still work forever as long as it sat
    // in the DB. We now verify the JWT itself first.
    let payload: { id: string; email: string; role: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findFirst({ where: { id: payload.id, refreshToken } });
    if (!user) throw new AppError('Invalid refresh token', 401);

    const newAccessToken = generateAccessToken(user.id, user.email, user.role);
    const newRefreshToken = generateRefreshToken(user.id, user.email, user.role);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Don't reveal if email exists

    const resetToken = generateResetToken();
    const resetTokenExp = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    const resetUrl = `${config.frontendUrl.split(',')[0]}/reset-password/${resetToken}`;

    try {
      await emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (err: any) {
      console.error(`[auth] Failed to send password reset email to ${user.email}: ${err.message}`);
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gte: new Date() } },
    });
    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExp: null },
    });
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        phone: true, bio: true, isVerified: true, createdAt: true,
        _count: { select: { projects: true, notes: true, savedCalculations: true } },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; bio?: string; avatar?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, bio: true },
    });
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}

export const authService = new AuthService();
