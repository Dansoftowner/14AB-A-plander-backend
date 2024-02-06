import mongoose, { Schema, Types } from 'mongoose'

export interface RestorationToken {
  memberId: Types.ObjectId
  token: string
  createdAt: Date
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
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
})

restorationTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 })

export default mongoose.model(
  'RestorationToken',
  restorationTokenSchema,
  'restorationTokens',
)
