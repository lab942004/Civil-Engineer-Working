import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import type { AuthenticatedRequest } from '../types';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await authService.register({ name, email, password, role });
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for a verification code.',
      data: user,
    });
  } catch (error) { next(error); }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyOtp(email, code);
    res.json({ success: true, message: 'Email verified successfully.', data: result });
  } catch (error) { next(error); }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.resendOtp(req.body.email);
    res.json({ success: true, message: 'If the account exists and is unverified, a new code has been sent.' });
  } catch (error) { next(error); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, message: 'Login successful', data: result });
  } catch (error) { next(error); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (error) { next(error); }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (error) { next(error); }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, message: 'Password reset successful.' });
  } catch (error) { next(error); }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (error) { next(error); }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, message: 'Profile updated', data: profile });
  } catch (error) { next(error); }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) { next(error); }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await authService.logout(req.user!.id);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) { next(error); }
};
