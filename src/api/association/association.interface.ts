import { Schema } from 'mongoose'

export interface Association {
  _id: Schema.Types.ObjectId
  name: string
  location: string
  certificate: string
}
