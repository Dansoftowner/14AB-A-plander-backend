import Joi from 'joi'
import { JoiObjectId } from '../../utils/joi'
import { Type } from 'class-transformer'

/**
 * @openapi
 * components:
 *  schemas:
 *   AssignmentUpdate:
 *     type: object
 *     properties:
 *       title:
 *         type: string
 *         description: The title of the assignment.
 *         minLength: 5
 *         maxLength: 255
 *         example: Gyerkőc fesztivál járőrözés
 *       location:
 *         type: string
 *         description: A string that identifies the geographical place.
 *         minLength: 2
 *         maxLength: 255
 *         example: 'Széchenyi tér'
 *       start:
 *         type: string
 *         format: date-time
 *         description: The start date-time of the assignment.
 *         example: 2023-03-01T08:00:00Z
 *       end:
 *         type: string
 *         format: date-time
 *         description: The end date-time of the assignment.
 *         example: 2023-03-01T16:30:00Z
 *       assignees:
 *         type: array
 *         description: the member ids of the assignees
 *         items:
 *           type: string
 *           format: objectId
 *         example: ['652f85c4fc13ae3d596c7ce8', '652f85c4fc13ae3d596c7cf4']
 */
export class AssignmentUpdateDto {
  title?: string
  location?: string
  assignees?: string[]

  @Type(() => Date) start?: Date
  @Type(() => Date) end?: Date

  static get validationSchema() {
    return Joi.object({
      title: Joi.string().min(5).max(255),
      location: Joi.string().min(2).max(255),
      start: Joi.date().min('now'),
      end: Joi.date().greater(Joi.ref('start')).min('now'),
      assignees: Joi.array().items(JoiObjectId()).unique(),
    })
  }
}
