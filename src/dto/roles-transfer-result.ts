import { Expose } from 'class-transformer'

/**
 * @openapi
 * components:
 *  schemas:
 *   RolesTransferResult:
 *     type: object
 *     properties:
 *      _id:
 *        type: string
 *        description: 'Unique identifier of the member who recieved new roles.'
 *        example: '652f866cfc13ae3ce86c7ce7'
 *      roles:
 *        type: array
 *        description: 'Indicates what roles the member has (member, president)'
 *        items:
 *          type: string
 *        minItems: 1
 *        maxItems: 2
 *        uniqueItems: true
 *        example: ['member', 'president']
 */
export class MemberRolesTransferResultDto {
  @Expose()
  _id!: string

  @Expose()
  roles!: string[]
}
