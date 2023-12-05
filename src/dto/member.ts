import { Expose, Type } from 'class-transformer'

/**
 * @openapi
 * components:
 *  schemas:
 *   Member:
 *     type: object
 *     properties:
 *      _id:
 *        type: string
 *        description: 'Unique identifier of the member'
 *        example: '652f866cfc13ae3ce86c7ce7'
 *      isRegistered:
 *        type: boolean
 *        description: 'Shows whether the member is registered (_true_) or just invited (_false_)'
 *        example: true
 *      email:
 *        type: string
 *        description: 'Email address of the member'
 *        example: 'bverchambre0@alibaba.com'
 *      username:
 *        type: string
 *        description: 'The username of the member'
 *        example: 'gizaac0'
 *      name:
 *        type: string
 *        description: 'The full name of the member'
 *        example: 'Reizinger Szabolcs'
 *      address:
 *        type: string
 *        description: 'The geographical address of the member (only visible to president members)'
 *        example: 'Magyarország, 7300 PillaFalva Maniel utca 12.'
 *      idNumber:
 *        type: string
 *        description: 'The Identity Card number of the member'
 *        example: '589376QN'
 *      phoneNumber:
 *        type: string
 *        description: 'The phone number of the member'
 *        example: '+86 (120) 344-7474'
 *      guardNumber:
 *        type: string
 *        description: 'The Guard Card number of the member'
 *        example: '08/0019/161373'
 *      roles:
 *        type: string
 *        description:
 *
 */
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
