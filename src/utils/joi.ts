import Joi from 'joi'

export function JoiObjectId(): Joi.StringSchema<string> {
  return Joi.string().hex().length(24)
}
