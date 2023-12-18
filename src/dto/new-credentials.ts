import Joi, { ObjectSchema } from 'joi'
import { JoiPassword, JoiUsername } from '../utils/joi'

export class NewCredentialsDto {
  username!: string
  password!: string

  static validationSchmema(): ObjectSchema<NewCredentialsDto> {
    return Joi.object({
      username: JoiUsername(),
      password: JoiPassword(),
    })
  }
}
