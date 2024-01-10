import { Expose, Type } from 'class-transformer'

export class DatePaginationInfoDto {
  @Expose()
  @Type(() => Date)
  start!: Date

  @Expose()
  @Type(() => Date)
  end!: Date
}
