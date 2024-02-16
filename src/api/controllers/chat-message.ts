import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import { ChatService } from '../../services/chat'
import { resolveOptions } from '../params/chat-messages-query-params'
import { instanceToPlain } from 'class-transformer'
import container from '../../di'

export class ChatMessageController implements Controller {
  async getChatMessages(req: Request, res: Response) {
    const association = req.scope!.resolve('clientInfo').association

    const chatService: ChatService = container.resolve('chatService')

    const messages = await chatService.get(association, resolveOptions(req))

    res.status(200).send(instanceToPlain(messages))
  }
}
