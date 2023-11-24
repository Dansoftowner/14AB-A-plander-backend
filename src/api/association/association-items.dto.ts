import { Expose, Type } from 'class-transformer'
import { PaginationInfoDto } from '../pagination-info.dto'
import { Association } from './association.interface'
import { AssociationDto } from './association.dto'

/**
 * @openapi
 * components:
 *  schemas:
 *    AssociationItems:
 *      type: object
 *      properties:
 *         metadata:
 *             $ref: '#/components/schemas/PaginationInfo'
 *         items:
 *            type: array
 *            description: 'The array of associations.'
 *            items:
 *              $ref: '#/components/schemas/Association'
 */
export class AssociationItemsDto {
  @Expose()
  @Type(() => PaginationInfoDto)
  metadata!: PaginationInfoDto

  @Expose()
  @Type(() => AssociationDto)
  items!: Association[]
}
