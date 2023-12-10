import mongoose, { Schema, Types } from 'mongoose'

export interface RegistrationToken {
  memberId: Types.ObjectId
  token: string
}

const registrationTokenSchema = new Schema<RegistrationToken>({
  memberId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Member',
  },
  token: {
    type: String,
    required: true,
  },
})

export default mongoose.model(
  'RegistrationToken',
  registrationTokenSchema,
  'registrationTokens',
)
