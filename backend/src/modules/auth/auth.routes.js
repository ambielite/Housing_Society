const express = require('express');
const controller = require('./auth.controller');
const validate = require('../../common/validate');
const {
  registerSchema, loginSchema, refreshSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema,
  residentOtpResetPasswordSchema,
} = require('./auth.validation');
const { authenticate } = require('../../common/authMiddleware');
const { authLimiter } = require('../../common/rateLimiter');

const router = express.Router();

// authLimiter (Phase 19): these are the realistic brute-force targets -
// an attacker guessing passwords, spamming registrations, or abusing
// the password-reset flow to enumerate valid emails. Every other auth
// route (refresh, logout, me, change-password) already requires either
// a valid token or a valid refresh token, so brute-forcing them isn't
// the same class of risk - only these four get the stricter limiter.
router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/refresh', validate(refreshSchema), controller.refresh);
router.post('/logout', validate(refreshSchema), controller.logout);
router.post('/logout-all', authenticate, controller.logoutAll);
router.get('/me', authenticate, controller.me);
router.post('/change-password', authenticate, validate(changePasswordSchema), controller.changePassword);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), controller.resetPassword);
router.post('/resident-forgot-password', authLimiter, validate(forgotPasswordSchema), controller.requestResidentPasswordResetOtp);
router.post('/resident-reset-password', authLimiter, validate(residentOtpResetPasswordSchema), controller.resetResidentPasswordWithOtp);
router.post('/admin-forgot-password', authLimiter, validate(forgotPasswordSchema), controller.requestAdminPasswordResetOtp);
router.post('/admin-reset-password', authLimiter, validate(residentOtpResetPasswordSchema), controller.resetAdminPasswordWithOtp);

module.exports = router;
