import { Expose, Type } from 'class-transformer'
import { PaginationInfoDto } from './pagination-info'
import { MemberDto } from './member'

export class MemberItemsDto {
  @Expose()
  @Type(() => PaginationInfoDto)
  metadata!: PaginationInfoDto

  @Expose()
  @Type(() => MemberDto)
  items!: MemberDto[]
}
