import { FilterQuery } from 'mongoose'
import { Repository } from '../base/repository'
import memberModel, { Member } from '../models/member'
import { sanitizeForRegex as s } from '../utils/sanitize'
import { MemberInviteDto } from '../dto/member-invite'
import _ from 'lodash'

export interface MemberQueryOptions {
  associationId: string
  offset?: number
  limit?: number
  sort?: string
  searchTerm?: string
  projection?: string
  showUnregistered?: boolean
}

export class MemberRepository implements Repository {
  async get(options: MemberQueryOptions): Promise<{ count: number; items: Member[] }> {
    const { offset, limit, sort, projection } = options
    const filter = this.filterQuery(options)

    const count = await memberModel.countDocuments(filter)
    const items = await memberModel
      .find(filter)
      .skip(offset!)
      .limit(limit!)
      .sort(sort)
      .select(projection!)

    return { count, items }
  }

  async findById(id: string, options: MemberQueryOptions) {
    const filter = this.filterQuery(options)
    filter._id = id

    return memberModel.findOne(filter).select(options.projection!)
  }

  async findByEmail(
    email: string,
    options: MemberQueryOptions,
  ): Promise<Member | null> {
    const filter = this.filterQuery(options)
    filter.email = email

    return (await memberModel.findOne(filter).select(options.projection!)) as Member
  }

  async findByUsername(
    username: string,
    options: MemberQueryOptions,
  ): Promise<Member | null> {
    const filter = this.filterQuery(options)
    filter.username = username

    return (await memberModel.findOne(filter).select(options.projection!)) as Member
  }

  async existsWithEmail(email: string, associationId: string): Promise<boolean> {
    return (await memberModel.exists({ email, association: associationId })) != null
  }

  async existsWithId(id: string): Promise<boolean> {
    return (await memberModel.exists({ _id: id })) != null
  }

  async insert(member: object): Promise<Member> {
    const inserted = await memberModel.insertMany([member])

    return inserted[0]
  }

  private filterQuery(options: MemberQueryOptions): FilterQuery<Member> {
    const filterObj: FilterQuery<Member> = {
      association: options.associationId,
      isRegistered: true,
    }

    if (options.showUnregistered) delete filterObj.isRegistered
    if (options.searchTerm) filterObj.name = new RegExp(s(options.searchTerm), 'i')

    return filterObj
  }
}
