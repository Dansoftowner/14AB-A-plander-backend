import Joi from 'joi'
import { JoiObjectId } from '../utils/joi'

export class CredentialsDto {
  associationId!: string
  user!: string
  password!: string
  isAutoLogin!: boolean

  static validationSchema(): Joi.ObjectSchema<CredentialsDto> {
    return Joi.object({
      associationId: JoiObjectId().required(),
      user: Joi.string().required(),
      password: Joi.string().required(),
      isAutoLogin: Joi.boolean().optional(),
    })
  }
}
