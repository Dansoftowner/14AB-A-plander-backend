import { FilterQuery } from 'mongoose'
import { Repository } from '../base/repository'
import memberModel, { Member } from '../models/member'
import { sanitizeForRegex as s } from '../utils/sanitize'

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
  getByEmail(associationId: string, email: string): Promise<Member | null> {
    return memberModel.findOne({ association: associationId, email })
  }

  getByUsername(associationId: string, username: string): Promise<Member | null> {
    return memberModel.findOne({ association: associationId, username })
  }

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

  async findById(options: MemberQueryOptions) {
    const filter = this.filterQuery(options)
    return memberModel.findOne(filter)
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
