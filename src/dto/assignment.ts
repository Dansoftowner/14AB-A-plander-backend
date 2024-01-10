import { Expose, Type } from 'class-transformer'
import { MemberDto } from './member'

export class AssignmentDto {
  @Expose()
  @Type(() => String)
  _id!: string

  @Expose()
  title!: string

  @Expose()
  location!: string

  @Expose()
  @Type(() => Date)
  start!: Date

  @Expose()
  @Type(() => Date)
  end!: Date

  @Expose()
  @Type(() => MemberDto)
  assignees!: MemberDto[]
}
