import { Expose, Type } from 'class-transformer'

export class MemberDto {
  @Expose()
  @Type(() => String)
  _id!: string

  @Expose()
  isRegistered!: boolean

  @Expose()
  email!: string

  @Expose()
  username!: string

  @Expose()
  name!: string

  @Expose()
  address!: string // only visible to self & presidents TODO: remove comments

  @Expose()
  idNumber!: string // only visible to self & presidents

  @Expose()
  phoneNumber!: string

  @Expose()
  guardNumber!: string // only visible to self & presidents

  @Expose()
  roles!: string[]
}
