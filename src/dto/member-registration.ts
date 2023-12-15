import Joi from 'joi'
import {
  fullNamePattern,
  guardNumberPattern,
  removeFlags as rf,
} from '../utils/common-regex'
import { JoiPassword } from '../utils/joi'

/**
 * @openapi
 * components:
 *  schemas:
 *    MemberRegistration:
 *      type: object
 *      properties:
 *        username:
 *          type: string
 *          description: 'The username that the member wants to register with'
 *          minLength: 5
 *          maxLength: 20
 *          example: 'imthebestmember1'
 *        password:
 *          type: string
 *          description: 'The password that the member wants to register with'
 *          minLength: 8
 *          example: 'Apple123'
 *        guardNumber:
 *          type: string
 *          description: 'The guard number of the member to invite'
 *          pattern: '\d{2}\/\d{4}\/\d{5}'
 *          example: '12/2030/32145'
 *        name:
 *          type: string
 *          description: 'The full name of the member'
 *          example: 'Mr John Franklin'
 *        address:
 *          type: string
 *          description: 'The geographical address of the member to invite'
 *          example: 'Hungary, 1101 Elite Avenue 12.'
 *        idNumber:
 *          type: string
 *          description: 'The Identity Card number of the member'
 *          example: '626376IE'
 *        phoneNumber:
 *          type: string
 *          description: 'The phone number of the member to invite'
 *          example: '+36 20 344-7474'
 *      required:
 *        - email
 */
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
      username: Joi.string().alphanum().min(5).max(20).required(),
      password: JoiPassword().required(),
      guardNumber: Joi.string().regex(rf(guardNumberPattern())).optional(),
      name: Joi.string().regex(rf(fullNamePattern())).required(),
      address: Joi.string().regex(/[0-9]/).required(),
      idNumber: Joi.string().required(),
      phoneNumber: Joi.string().required(),
    })
  }
}
