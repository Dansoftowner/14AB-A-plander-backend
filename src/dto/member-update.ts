import Joi from 'joi'
import {
  fullNamePattern,
  guardNumberPattern,
  removeFlags as rf,
} from '../utils/common-regex'

export class MemberUpdateDto {
  name?: string
  address?: string
  idNumber?: string
  phoneNumber?: string
  guardNumber?: string

  static validationSchema(): Joi.ObjectSchema<MemberUpdateDto> {
    return Joi.object({
      name: Joi.string().regex(rf(fullNamePattern())).required(),
      address: Joi.string().regex(/[0-9]/).required(),
      idNumber: Joi.string().optional(),
      phoneNumber: Joi.string().optional(),
      guardNumber: Joi.string().regex(rf(guardNumberPattern())).optional(),
    }).min(1)
  }
}
