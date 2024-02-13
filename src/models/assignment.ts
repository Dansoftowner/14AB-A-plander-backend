import mongoose, { Schema, Types } from 'mongoose'

export interface Assignment {
  _id: Types.ObjectId
  title: string
  location: string
  association: Types.ObjectId
  start: Date
  end: Date
  assignees: Array<{ _id: Types.ObjectId; name: string }>
  report: Types.ObjectId | null
}

const assignmentSchema = new Schema<Assignment>({
  title: {
    type: String,
    minlength: 5,
    maxlength: 255,
  },
  location: {
    type: String,
    minlength: 2,
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
    validate: [
      function (this: Assignment, value: Date) {
        return this.end >= value
      },
      'Start time must be less than end time!',
    ],
  },
  end: {
    type: Date,
    required: true,
    validate: [
      function (this: Assignment, value: Date) {
        return this.start <= value
      },
      'End time must be greater than start time!',
    ],
  },
  assignees: [
    {
      _id: Schema.Types.ObjectId,
      name: String,
    },
  ],
  report: {
    type: Schema.Types.ObjectId,
    ref: 'Report',
  },
})

assignmentSchema.index(
  { report: 1 },
  { unique: true, partialFilterExpression: { report: { $type: 'string' } } },
)

export default mongoose.model('Assignment', assignmentSchema, 'assignments')
