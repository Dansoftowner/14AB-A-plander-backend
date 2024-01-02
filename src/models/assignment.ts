import mongoose, { Date, Schema, Types } from 'mongoose'

export interface Assignment {
  _id: Types.ObjectId
  title: string
  location: string
  association: Types.ObjectId
  start: Date
  end: Date
  assignees: Array<{ _id: Types.ObjectId; name: string }>
}

const assignmentSchema = new Schema<Assignment>({
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  location: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  association: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Association',
    index: true,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  assignees: [
    {
      _id: Schema.Types.ObjectId,
      name: String,
    },
  ],
})

export default mongoose.model('Assignment', assignmentSchema, 'assignments')
