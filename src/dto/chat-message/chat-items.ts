import { Expose, Type } from 'class-transformer'
import { PaginationInfoDto } from '../pagination-info'
import { ChatMessageDto } from './chat-message'

/**
 * @openapi
 * components:
 *  schemas:
 *    ChatItems:
 *      type: object
 *      properties:
 *         metadata:
 *             type: object
 *             description: Pagination metadata.
 *             properties:
 *               offset:
 *                 type: integer
 *                 description: 'The number of items skipped.'
 *                 example: 0
 *               limit:
 *                 type: integer
 *                 description: 'The maximum number of items'
 *                 example: 10
 *         items:
 *            type: array
 *            description: 'The array of chat messages.'
 *            items:
 *              $ref: '#/components/schemas/ChatMessage'
 */
export class ChatItemsDto {
  @Expose()
  @Type(() => PaginationInfoDto)
  metadata!: PaginationInfoDto

  @Expose()
  @Type(() => ChatMessageDto)
  items!: ChatMessageDto[]
}
