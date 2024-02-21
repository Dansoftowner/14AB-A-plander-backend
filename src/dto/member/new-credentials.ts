import Joi, { ObjectSchema } from 'joi'
import { JoiPassword, JoiUsername } from '../../utils/joi'

/**
 * @openapi
 * components:
 *  schemas:
 *    NewCredentials:
 *      type: object
 *      properties:
 *        email:
 *          type: string
 *          description: 'The new email to update to'
 *          example: 'newemail@alibaba.com'
 *        username:
 *          type: string
 *          description: 'The username to update to'
 *          example: 'newGizaac0'
 *        password:
 *          type: string
 *          description: 'The new password to update to'
 *          example: 'NewApple123'
 *      required:
 *        anyOf:
 *         - username
 *         - password
 */
export class NewCredentialsDto {
  email!: string
  username!: string
  password!: string

  static get validationSchema(): ObjectSchema<NewCredentialsDto> {
    return Joi.object({
      email: Joi.string().email(),
      username: JoiUsername(),
      password: JoiPassword(),
    }).or('email', 'username', 'password')
  }
}
