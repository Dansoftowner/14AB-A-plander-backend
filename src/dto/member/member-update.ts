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
 *   MemberUpdate:
 *     type: object
 *     properties:
 *      name:
 *        type: string
 *        description: 'The full name of the member'
 *        example: 'Fergeteges Szabolcs'
 *      address:
 *        type: string
 *        description: 'The geographical address of the member (only visible to president members)'
 *        example: 'Hungary, 7300 PillaFalva Maniel utca 12.'
 *      idNumber:
 *        type: string
 *        description: 'The Identity Card number of the member'
 *        example: '589376QN'
 *      phoneNumber:
 *        type: string
 *        description: 'The phone number of the member'
 *        example: '+86 (120) 344-7474'
 *      guardNumber:
 *        type: string
 *        description: 'The Guard Card number of the member'
 *        example: '08/0019/161373'
 */
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
