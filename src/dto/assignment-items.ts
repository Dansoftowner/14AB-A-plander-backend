import { Expose, Type } from 'class-transformer'
import { DatePaginationInfoDto } from './date-pagination-info'
import { AssignmentDto } from './assignment'

export class AssignmentItemsDto {
  @Expose()
  @Type(() => DatePaginationInfoDto)
  metadata!: DatePaginationInfoDto

  @Expose()
  @Type(() => AssignmentDto)
  items!: AssignmentDto[]
}
