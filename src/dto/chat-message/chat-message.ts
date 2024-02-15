import { Exclude, Expose, Type } from 'class-transformer'
import { MemberDto } from '../member/member'

/**
 * @openapi
 * components:
 *  schemas:
 *    ChatMessage:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *          description: 'Unique identifier of the chat message'
 *          example: '655f15d623380f3b6a0f7b28'
 *        sender:
 *           type: object
 *           description: The sender member's information (_id and name).
 *           properties:
 *              _id:
 *                type: string
 *                description: 'Unique identifier of the member'
 *                example: '652f866cfc13ae3ce86c7ce7'
 *              name:
 *                type: string
 *                description: 'The full name of the member'
 *                example: 'Reizinger Szabolcs'
 *        content:
 *          type: string
 *          description: 'The content of the chat message'
 *          example: 'Hi all!'
 *        timestamp:
 *           type: string
 *           format: date-time
 *           description: The time when the chat message was submitted.
 *           example: '2024-02-15T07:36:20.512Z'
 *
 */
export class ChatMessageDto {
  @Expose()
  @Type(() => String)
  _id!: string

  @Expose()
  @Type(() => MemberDto)
  sender!: MemberDto

  @Expose()
  @Type(() => Date)
  timestamp!: Date

  @Expose()
  content!: string
}
