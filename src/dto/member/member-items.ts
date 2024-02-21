import { Expose, Type } from 'class-transformer'
import { PaginationInfoDto } from '../pagination-info'
import { MemberDto } from './member'

/**
 * @openapi
 * components:
 *  schemas:
 *    MemberItems:
 *      type: object
 *      properties:
 *         metadata:
 *             $ref: '#/components/schemas/PaginationInfo'
 *         items:
 *            type: array
 *            description: 'The array of associations.'
 *            items:
 *              $ref: '#/components/schemas/Member'
 */
export class MemberItemsDto {
  @Expose()
  @Type(() => PaginationInfoDto)
  metadata!: PaginationInfoDto

  @Expose()
  @Type(() => MemberDto)
  items!: MemberDto[]
}
