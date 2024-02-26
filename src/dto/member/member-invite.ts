import Joi from 'joi'
import {
  fullNamePattern,
  guardNumberPattern,
  removeFlags as rf,
} from '../../utils/common-regex'

/**
 * @openapi
 * components:
 *  schemas:
 *    MemberInvite:
 *      type: object
 *      properties:
 *        email:
 *          type: string
 *          description: 'The email of the member to invite'
 *          example: 'mrguardmaster@cryptomail.com'
 *        guardNumber:
 *          type: string
 *          description: 'The guard number of the member to invite'
 *          example: '12/2030/32145'
 *        name:
 *          type: string
 *          description: 'The name of the member to invite'
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
export class MemberInviteDto {
  email!: string
  guardNumber?: string
  name?: string
  address?: string
  phoneNumber?: string

  static get validationSchema(): Joi.ObjectSchema<MemberInviteDto> {
    return Joi.object({
      email: Joi.string().email().required(),
      guardNumber: Joi.string().regex(rf(guardNumberPattern())).optional(),
      name: Joi.string().regex(rf(fullNamePattern())).optional(),
      address: Joi.string().regex(/[0-9]/).optional(),
      phoneNumber: Joi.string().min(1).optional(),
    })
  }
}
