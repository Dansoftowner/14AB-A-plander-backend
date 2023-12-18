import Joi, { ObjectSchema } from 'joi'
import { JoiPassword, JoiUsername } from '../utils/joi'

/**
 * @openapi
 * components:
 *  schemas:
 *    NewCredentials:
 *      type: object
 *      properties:
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
  username!: string
  password!: string

  static validationSchema(): ObjectSchema<NewCredentialsDto> {
    return Joi.object({
      username: JoiUsername(),
      password: JoiPassword(),
    }).or('username', 'password')
  }
}
