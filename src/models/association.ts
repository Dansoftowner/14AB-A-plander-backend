import mongoose, { Schema, Types } from 'mongoose'

export interface Association {
  _id: Types.ObjectId
  name: string
  location: string
  certificate: string
}

const associationSchema = new Schema<Association>({
  name: {
    type: String,
    required: true,
    min: 5,
    max: 255,
  },
  location: {
    type: String,
    required: true,
    min: 5,
    max: 255,
  },
  certificate: {
    type: String,
    validate: [/\d{2}\/\d{4}/, 'Association certificate has invalid format!'],
  },
})

export default mongoose.model('Association', associationSchema, 'associations')
