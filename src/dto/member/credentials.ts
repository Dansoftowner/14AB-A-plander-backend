import Joi from 'joi'
import { JoiObjectId } from '../../utils/joi'
import { Transform } from 'class-transformer'
import { isEmail } from '../../utils/common-regex'

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
 *      required:
 *        - associationId
 *        - user
 *        - password
 */
export class CredentialsDto {
  associationId!: string
  @Transform(({ value }) => {
    if (isEmail(value)) value = value.toLowerCase()
    return value.trim()
  })
  user!: string
  password!: string

  static get validationSchema(): Joi.ObjectSchema<CredentialsDto> {
    return Joi.object({
      associationId: JoiObjectId().required(),
      user: Joi.string().required(),
      password: Joi.string().required(),
    })
  }
}
