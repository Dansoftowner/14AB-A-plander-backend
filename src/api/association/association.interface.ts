import { Types } from 'mongoose'

export interface Association {
  _id: Types.ObjectId
  name: string
  location: string
  certificate: string
}
