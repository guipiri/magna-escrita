import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  MERCADOPAGO_ACCESS_TOKEN: Joi.string().required(),
  MERCADOPAGO_WEBHOOK_SECRET: Joi.string().required(),
  DATABASE_URL: Joi.string().uri().required(),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN_MILLISECONDS: Joi.number().default(604800000), // 7 days
  AUTH_COOKIE_NAME: Joi.string().default('auth_token'),
  AUTH_COOKIE_MAX_AGE_DAYS: Joi.number().default(7),
  GEMINI_API_KEY: Joi.string().required(),
  CLOUDFLARE_R2_ACCOUNT_ID: Joi.string().required(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: Joi.string().required(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: Joi.string().required(),
  CLOUDFLARE_R2_BUCKET_NAME: Joi.string().required(),
  CLOUDFLARE_R2_PUBLIC_URL: Joi.string().uri().required(),
  SMTP_HOST: Joi.string().default('localhost'),
  SMTP_PORT: Joi.number().default(1025),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_FROM: Joi.string().default('noreply@magnaescrita.com.br'),
  REDIS_URL: Joi.string().uri().required(),
});
