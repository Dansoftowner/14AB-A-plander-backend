import mongoose, { Schema, Types } from 'mongoose'

export interface RestorationToken {
  memberId: Types.ObjectId
  token: string
}

const restorationTokenSchema = new Schema<RestorationToken>({
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
  'RestorationToken',
  restorationTokenSchema,
  'restorationTokens',
)
