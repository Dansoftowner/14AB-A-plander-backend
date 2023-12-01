import { Expose, Type } from 'class-transformer'
import { PaginationInfoDto } from './pagination-info'

export class MemberItemsDto {
  @Expose()
  @Type(() => PaginationInfoDto)
  metadata!: PaginationInfoDto

  // TODO: items
}
