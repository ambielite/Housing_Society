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

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
