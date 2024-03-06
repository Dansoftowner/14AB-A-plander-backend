import Joi from 'joi'
import { JoiObjectId, JoiPassword } from '../../utils/joi'
import { Transform } from 'class-transformer'

/**
 * @openapi
 * components:
 *  schemas:
 *    ForgottenPassword:
 *      type: object
 *      properties:
 *        associationId:
 *          type: string
 *          description: 'Unique identifier of the association'
 *          example: '652f7b95fc13ae3ce86c7cdf'
 *        email:
 *          type: string
 *          description: 'The email address of the member who wants to restore his password'
 *          example: 'bverchambre0@alibaba.com'
 *      required:
 *        - association
 *        - email
 */
export class ForgottenPasswordDto {
  associationId!: string
  @Transform(({ value }) => value.trim().toLowerCase())
  email!: string

  static get validationSchema(): Joi.ObjectSchema<ForgottenPasswordDto> {
    return Joi.object({
      associationId: JoiObjectId().required(),
      email: Joi.string().email().required(),
    })
  }
}

/**
 * @openapi
 * components:
 *  schemas:
 *    NewPassword:
 *      type: object
 *      properties:
 *       password:
 *          type: string
 *          description: 'The new password that will replace the forgotten password'
 *          minLength: 8
 *          example: 'Orange123'
 *      required:
 *        - password
 */
export class NewPasswordDto {
  password!: string

  static get validationSchema(): Joi.ObjectSchema<NewPasswordDto> {
    return Joi.object({
      password: JoiPassword().required(),
    })
  }
}
