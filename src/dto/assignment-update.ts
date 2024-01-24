import Joi from 'joi'
import { JoiObjectId } from '../utils/joi'
import { Type } from 'class-transformer'

export class AssignmentUpdateDto {
  title?: string
  location?: string
  assignees?: string[]

  @Type(() => Date) start?: Date
  @Type(() => Date) end?: Date

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
