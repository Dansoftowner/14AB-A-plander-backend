import { Expose, Type } from 'class-transformer'
import { PaginationInfoDto } from './pagination-info'
import { AssociationDto } from './association'

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
  items!: AssociationDto[]
}
