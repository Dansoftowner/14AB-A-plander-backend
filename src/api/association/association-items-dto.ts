import { Expose, Type } from 'class-transformer'
import { PaginationInfoDto } from '../pagination-info-dto'
import { Association } from './association'
import { AssociationDto } from './association-dto'

export class AssociationItemsDto {
  @Expose()
  @Type(() => PaginationInfoDto)
  metadata!: PaginationInfoDto

  @Expose()
  @Type(() => AssociationDto)
  items!: Association[]
}
