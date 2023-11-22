import { Expose } from 'class-transformer'

export class PaginationInfoDto {
  @Expose()
  total?: number

  @Expose()
  offset!: number

  @Expose()
  limit!: number
}
