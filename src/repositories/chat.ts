import { ChatMessageDto } from '../dto/chat-message/chat-message'
import ChatMessageModel, { ChatMessage } from '../models/chat-message'

export class ChatRepository {
  async insert(message: ChatMessageDto): Promise<void> {
    const chatMessage = new ChatMessageModel(message)

    await chatMessage.save()
  }
}
