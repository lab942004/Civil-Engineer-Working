import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = Router();

// Tighter rate limits on OTP endpoints — these are the most likely target
// for abuse (email bombing / brute-forcing a 6-digit code).
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many verification requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// BUG FOUND IN AUDIT: /login and /register had NO rate limiting at all —
// unlimited login attempts against any account, and unlimited account
// creation. Added dedicated limiters: login is tighter (10/15min) since
// it's the brute-force target; register is looser (10/hour, same window
// style) since legitimate multi-account signups from one IP (e.g. an
// office) are more plausible than 10 legitimate logins failing in a row.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many accounts created from this network. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerLimiter, authController.register);
router.post('/verify-otp', otpVerifyLimiter, authController.verifyOtp);
router.post('/resend-otp', otpRequestLimiter, authController.resendOtp);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', otpRequestLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticate, authController.getProfile);
router.put('/me', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

export default router;
