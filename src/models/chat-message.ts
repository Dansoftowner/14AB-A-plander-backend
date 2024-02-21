import mongoose, { Schema, SchemaType, Types } from 'mongoose'

export interface ChatMessage {
  _id: Types.ObjectId
  association: Types.ObjectId
  sender: { _id: Types.ObjectId; name: string }
  timestamp: Date
  content: string
}

const senderSchema = new Schema({
  _id: {
    type: Types.ObjectId,
    required: true,
    ref: 'Member',
  },
  name: String,
})

const messageSchema = new Schema<ChatMessage>({
  association: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Association',
  },
  sender: {
    type: senderSchema,
    required: true,
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

messageSchema.index({ timestamp: -1 }, { expires: '30d' })

export default mongoose.model('ChatMessage', messageSchema, 'chatMessages')
