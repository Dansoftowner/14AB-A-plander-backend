import { Expose, Type } from 'class-transformer'
import { DatePaginationInfoDto } from '../date-pagination-info'
import { AssignmentDto } from './assignment'

/**
 * @openapi
 * components:
 *  schemas:
 *    AssignmentItems:
 *      type: object
 *      properties:
 *         metadata:
 *             $ref: '#/components/schemas/DatePaginationInfo'
 *         items:
 *            type: array
 *            description: 'The array of assignments.'
 *            items:
 *              $ref: '#/components/schemas/Assignment'
 */
export class AssignmentItemsDto {
  @Expose()
  @Type(() => DatePaginationInfoDto)
  metadata!: DatePaginationInfoDto

  @Expose()
  @Type(() => AssignmentDto)
  items!: AssignmentDto[]
}
