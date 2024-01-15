import Joi from 'joi'
import { JoiObjectId } from '../utils/joi'

export class AssignmentInsertionDto {
  title!: string
  location!: string
  start!: Date
  end!: Date
  assignees!: string[]

  static validationSchema() {
    return Joi.object({
      title: Joi.string().required(),
      location: Joi.string().required(),
      start: Joi.date().required(),
      end: Joi.date().greater(Joi.ref('start')).required(),
      assignees: Joi.array().items(JoiObjectId()).unique(),
    })
  }
}
