import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config';

export const generateAccessToken = (userId: string, email: string, role: string): string => {
  return jwt.sign({ id: userId, email, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (userId: string, email: string, role: string): string => {
  return jwt.sign({ id: userId, email, role }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateResetToken = (): string => {
  return crypto.randomUUID();
};

/**
 * Generates a numeric OTP of the given length (default 6 digits) using a
 * cryptographically secure random source (not Math.random()).
 */
export const generateOtp = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
};

export const hashOtp = async (otp: string): Promise<string> => {
  return bcrypt.hash(otp, 10);
};

export const compareOtp = async (otp: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(otp, hash);
};

export const verifyRefreshToken = (token: string): { id: string; email: string; role: string } => {
  return jwt.verify(token, config.jwt.refreshSecret) as { id: string; email: string; role: string };
};

export const paginate = (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

export const buildPaginationMeta = (total: number, page: number, limit: number) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};