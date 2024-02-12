import mongoose, { Schema, Types } from 'mongoose'

export interface ChatMessage {
  _id: Types.ObjectId
  association: Types.ObjectId
  sender: Types.ObjectId
  timestamp: Date
  content: string
}

const messageSchema = new Schema<ChatMessage>({
  association: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Association',
  },
  sender: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Member',
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  content: {
    type: String,
    required: true,
    maxlength: 1024,
    minlength: 1,
  },
})

messageSchema.index({ timestamp: 1 }, { expires: '30d' })

export default mongoose.model('ChatMessage', messageSchema, 'chatMessages')
