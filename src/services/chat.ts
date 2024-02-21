import { Server, Socket } from 'socket.io'
import { ChatRepository } from '../repositories/chat'
import { ChatMessageDto } from '../dto/chat-message/chat-message'
import { plainToInstance } from 'class-transformer'
import { ChatMessageQueryOptions } from '../api/params/chat-messages-query-params'
import { ChatItemsDto } from '../dto/chat-message/chat-items'

export class ChatService {
  constructor(
    private readonly io: Server,
    private readonly chatRepository: ChatRepository,
  ) {
    this.init()
  }

  async get(association: string, options: ChatMessageQueryOptions): Promise<any> {
    const items = await this.chatRepository.get(association, options)
    const metadata = { offset: options.offset, limit: options.limit }

    return plainToInstance(
      ChatItemsDto,
      {
        metadata,
        items,
      },
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      },
    )
  }

  /**
   * Encapsulates the business logic for sending a chat message.
   */
  private async sendMessage(socket: Socket, message: string) {
    if (message.trim().length == 0) return
    if (message.length > 1024) return

    socket.broadcast
      .to(socket.associationId)
      .emit('recieve-message', this.assembleMessageDto(socket, message))

    await this.chatRepository.insert(
      socket.associationId,
      this.assembleMessageDto(socket, message),
    )
  }

  /**
   * Assembles the message object that will be saved into the database.
   */
  private assembleMessageDto(socket: Socket, message: string): ChatMessageDto {
    return plainToInstance(ChatMessageDto, {
      sender: {
        _id: socket.memberId,
        name: socket.name,
      },
      timestamp: new Date(),
      content: message,
    })
  }

  private init() {
    this.io.on('connection', (socket) => {
      socket.join(socket.associationId)

      socket.on('send-message', async (message) => {
        await this.sendMessage(socket, message)
      })
    })
  }
}
