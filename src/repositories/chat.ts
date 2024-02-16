import { ChatMessageQueryOptions } from '../api/params/chat-messages-query-params'
import { ChatMessageDto } from '../dto/chat-message/chat-message'
import ChatMessageModel, { ChatMessage } from '../models/chat-message'

export class ChatRepository {
  async get(
    association: string,
    options: ChatMessageQueryOptions,
  ): Promise<ChatMessage[]> {
    const filter = { association }
    const { offset, limit } = options

    const chatMessages = await ChatMessageModel.find(filter)
      .skip(offset)
      .limit(limit)
      .sort('-timestamp')

    return chatMessages
  }

  async insert(association: string, message: ChatMessageDto): Promise<void> {
    const chatMessage = new ChatMessageModel({
      ...message,
      association,
    })

    await chatMessage.save()
  }
}
