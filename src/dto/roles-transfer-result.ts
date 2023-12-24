import { Expose } from 'class-transformer'

export class MemberRolesTransferResultDto {
  @Expose()
  _id!: string

  @Expose()
  roles!: string[]
}
