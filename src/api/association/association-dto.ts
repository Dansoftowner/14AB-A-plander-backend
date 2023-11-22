import { Schema } from 'mongoose'
import { Association } from './association'
import { Expose } from 'class-transformer'

export class AssociationDto implements Association {
  @Expose()
  _id!: Schema.Types.ObjectId

  @Expose()
  name!: string

  @Expose()
  location!: string

  @Expose()
  certificate!: string
}
