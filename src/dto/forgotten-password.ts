import Joi from 'joi'
import { JoiObjectId, JoiPassword } from '../utils/joi'

export class ForgottenPasswordDto {
  association!: string
  email!: string

  static validationSchema(): Joi.ObjectSchema<ForgottenPasswordDto> {
    return Joi.object({
      association: JoiObjectId().required(),
      email: Joi.string().email().required(),
    })
  }
}

export class NewPasswordDto {
  password!: string

  static validationSchema(): Joi.ObjectSchema<NewPasswordDto> {
    return Joi.object({
      password: JoiPassword().required(),
    })
  }
}