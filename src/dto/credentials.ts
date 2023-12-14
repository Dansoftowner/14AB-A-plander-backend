import Joi from 'joi'
import { JoiObjectId } from '../utils/joi'

/**
 * @openapi
 * components:
 *  schemas:
 *    Credentials:
 *      type: object
 *      properties:
 *        associationId:
 *          type: string
 *          description: 'Unique identifier of the association'
 *          example: '652f7b95fc13ae3ce86c7cdf'
 *        user:
 *          type: string
 *          description: 'Username or email of the member'
 *          example: 'gizaac0'
 *        password:
 *          type: string
 *          description: 'The plain text password'
 *          example: 'Apple123'
 *        isAutoLogin:
 *          type: boolean
 *          description: 'Whether the user should be automatically logged in (if true, a permanent cookie will be returned)'
 *          example: false
 *      required:
 *        - associationId
 *        - user
 *        - password
 */
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
