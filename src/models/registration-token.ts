import mongoose, { Schema, Types } from 'mongoose'

export interface RegistrationToken {
  memberId: Types.ObjectId
  token: string
  createdAt: Date
}

const registrationTokenSchema = new Schema<RegistrationToken>({
  memberId: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'Member',
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
})

registrationTokenSchema.index({ createdAt: 1 }, { expires: '72h' })

export default mongoose.model(
  'RegistrationToken',
  registrationTokenSchema,
  'registrationTokens',
)
