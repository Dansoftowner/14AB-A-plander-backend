import Joi from 'joi'

export function JoiObjectId(): Joi.StringSchema<string> {
  return Joi.string().hex().length(24)
}

export function JoiPassword(): Joi.StringSchema<string> {
  return Joi.string().min(8).regex(/\d/).regex(/[A-Z]/).regex(/[a-z]/)
}
