import mongoose, { Schema } from 'mongoose'
import { Association } from './association.interface'

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
