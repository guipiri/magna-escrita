import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  MERCADOPAGO_ACCESS_TOKEN: Joi.string().required(),
  MERCADOPAGO_WEBHOOK_SECRET: Joi.string().required(),
  APP_URL: Joi.string().uri().required(),
  API_URL: Joi.string().uri().required(),
});
