const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  societyId: Joi.string().uuid().allow(null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  clientType: Joi.string().valid('web', 'resident_app').default('web'),
  securityCode: Joi.string().trim().max(50),
  selfieMimeType: Joi.string().valid('image/jpeg', 'image/png').when('securityCode', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  selfieData: Joi.string().base64().min(12).max(2_000_000).when('securityCode', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

const residentOtpResetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().pattern(/^\d{6}$/).required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  residentOtpResetPasswordSchema,
};
