import Joi from 'joi'
import {
  fullNamePattern,
  guardNumberPattern,
  removeFlags as rf,
} from '../utils/common-regex'

export class MemberInviteDto {
  email!: string
  guardNumber?: string
  name?: string
  address?: string
  idNumber?: string
  phoneNumber?: string

  static validationSchema(): Joi.ObjectSchema<MemberInviteDto> {
    return Joi.object({
      email: Joi.string().email().required(),
      guardNumber: Joi.string().pattern(rf(guardNumberPattern())).optional(),
      name: Joi.string().pattern(rf(fullNamePattern())).optional(),
      address: Joi.string().pattern(/[0-9]/).optional(),
      idNumber: Joi.string().optional(),
      phoneNumber: Joi.string().min(1).optional(),
    })
  }
}
