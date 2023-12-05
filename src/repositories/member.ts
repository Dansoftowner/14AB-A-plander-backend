import { FilterQuery } from 'mongoose'
import { Repository } from '../base/repository'
import memberModel, { Member } from '../models/member'
import { sanitizeForRegex as s } from '../utils/sanitize'

export class MemberRepository implements Repository {
  getByEmail(associationId: string, email: string): Promise<Member | null> {
    return memberModel.findOne({ association: associationId, email })
  }

  getByUsername(associationId: string, username: string): Promise<Member | null> {
    return memberModel.findOne({ association: associationId, username })
  }

  async get(
    associationId: string,
    { offset, limit, projection, sort, showUnregistered, searchTerm },
  ): Promise<{ count: number; items: Member[] }> {
    const filter = this.filterQuery(associationId, searchTerm, showUnregistered)

    const count = await memberModel.countDocuments(filter)
    const items = await memberModel
      .find(filter)
      .skip(offset)
      .limit(limit)
      .sort(sort)
      .select(projection)

    return { count, items }
  }

  private filterQuery(
    associationId: string,
    searchTerm?: string,
    showUnregistered?: boolean,
  ): FilterQuery<Member> {
    const filterObj: FilterQuery<Member> = {
      association: associationId,
      isRegistered: true,
    }

    if (showUnregistered) delete filterObj.isRegistered
    if (searchTerm) filterObj.name = new RegExp(s(searchTerm), 'i')

    return filterObj
  }
}
