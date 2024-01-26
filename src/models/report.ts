import mongoose, { Schema, Types } from 'mongoose'

type DutyMethod = 'vehicle' | 'bicycle' | 'pedestrian'

export interface Report {
  _id: Types.ObjectId
  assignment: Types.ObjectId
  member: Types.ObjectId
  method: DutyMethod
  purpose: string
  licensePlateNumber: string | null
  startKm: number | null
  endKm: number | null
  externalOrganization: string | null
  externalRepresentative: string | null
  description: string | null
}

const reportSchema = new Schema<Report>({
  assignment: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Assignment',
    unique: true,
  },
  member: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Member',
  },
  method: {
    type: String,
    required: true,
    enum: ['vehicle', 'bicycle', 'pedestrian'],
  },
  purpose: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  licensePlateNumber: {
    type: String,
    minlength: 5,
    maxlength: 255,
  },
  startKm: {
    type: Number,
    min: 0,
    validate: [
      function (this: Report, value: number) {
        return this.endKm === null || value <= this.endKm
      },
      'End km must be greater than start km!',
    ],
  },
  endKm: {
    type: Number,
    min: 0,
    validate: [
      function (this: Report, value: number) {
        return this.startKm === null || this.startKm <= value
      },
      'End km must be greater than start km!',
    ],
  },
  externalOrganization: {
    type: String,
    minlength: 5,
    maxlength: 255,
  },
  externalRepresentative: {
    type: String,
    minlength: 5,
    maxlength: 255,
    validate: [
      function (this: Report) {
        return this.externalOrganization
      },
      'External organization has to be provided if external representative is specified!',
    ],
  },
  description: {
    type: String,
    minlength: 5,
    maxlength: 1240,
  },
})

export default mongoose.model('Report', reportSchema, 'reports')
