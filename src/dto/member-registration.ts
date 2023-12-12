import Joi from 'joi'
import {
  fullNamePattern,
  guardNumberPattern,
  removeFlags as rf,
} from '../utils/common-regex'
import { JoiPassword } from '../utils/joi'

export class MemberRegistrationDto {
  username!: string
  password!: string
  guardNumber?: string
  name!: string
  address!: string
  idNumber!: string
  phoneNumber!: string

  static validationSchema(): Joi.ObjectSchema<MemberRegistrationDto> {
    return Joi.object({
      username: Joi.string().alphanum().min(5).required(),
      password: JoiPassword().required(),
      guardNumber: Joi.string().regex(rf(guardNumberPattern())).optional(),
      name: Joi.string().regex(rf(fullNamePattern())).required(),
      address: Joi.string().regex(/[0-9]/).required(),
      idNumber: Joi.string().required(),
      phoneNumber: Joi.string().required(),
    })
  }
}
