import Joi from 'joi';
import JoiDateFactory from '@joi/date';

// Validation schemas using Joi
export const userSchema = Joi.object({
  username: Joi.string().required(),
});

export const userIdSchema = Joi.number().integer().min(1).required().label('userId');

export const exerciseSchema = Joi.object({
  description: Joi.string().required(),
  duration: Joi.number().integer().min(1).required(),
  date: Joi.extend(JoiDateFactory).date().format('YYYY-MM-DD')
    .default(() => new Date().toISOString().slice(0, 10)),
});

export const logsQuerySchema = Joi.object({
  from: Joi.extend(JoiDateFactory).date().format('YYYY-MM-DD'),
  to: Joi.extend(JoiDateFactory).date().format('YYYY-MM-DD'),
  limit: Joi.number().integer().min(1),
});
