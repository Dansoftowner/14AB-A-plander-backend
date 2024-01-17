import Joi from 'joi'
import { JoiObjectId } from '../utils/joi'

export class AssignmentUpdateDto {
  title?: string
  location?: string
  start?: Date
  end?: Date
  assignees?: string[]

  static validationSchema() {
    return Joi.object({
      title: Joi.string(),
      location: Joi.string(),
      start: Joi.date(),
      end: Joi.date().greater(Joi.ref('start')),
      assignees: Joi.array().items(JoiObjectId()).unique(),
    })
  }
}
