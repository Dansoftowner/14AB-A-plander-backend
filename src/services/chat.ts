import { Server, Socket } from 'socket.io'
import { ChatRepository } from '../repositories/chat'
import mongoose from 'mongoose'
import { ChatMessage } from '../models/chat-message'
import { ChatMessageDto } from '../dto/chat-message/chat-message'
import { plainToInstance } from 'class-transformer'

export class ChatService {
  constructor(
    private readonly io: Server,
    private readonly chatRepository: ChatRepository,
  ) {
    this.init()
  }

  /**
   * Encapsulates the business logic for sending a chat message. 
   */
  private async sendMessage(socket: Socket, message: string) {
    socket.broadcast
      .to(socket.associationId)
      .emit('recieve-message', this.assembleMessageTransferObject(socket, message))

    await this.chatRepository.insert(this.assembleMessageDto(socket, message))
  }

  /**
   * Assembles the message object that will be sent over the sockets.
   */
  private assembleMessageTransferObject(socket: Socket, message: string) {
    return {
      memberId: socket.memberId,
      name: socket.name,
      timestamp: new Date(),
      content: message,
    }
  }

  /**
   * Assembles the message object that will be saved into the database.
   */
  private assembleMessageDto(socket: Socket, message: string): ChatMessageDto {
    return plainToInstance(ChatMessageDto, {
      association: socket.associationId,
      sender: socket.memberId,
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
