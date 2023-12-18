import Joi from 'joi'

export function JoiObjectId(): Joi.StringSchema<string> {
  return Joi.string().hex().length(24)
}

export function JoiPassword(): Joi.StringSchema<string> {
  return Joi.string().min(8).regex(/\d/).regex(/[A-Z]/).regex(/[a-z]/)
}

export function JoiUsername(): Joi.StringSchema<string> {
  return Joi.string().alphanum().min(5).max(20)
}