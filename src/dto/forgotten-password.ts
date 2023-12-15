import Joi from 'joi'
import { JoiObjectId } from '../utils/joi'

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
