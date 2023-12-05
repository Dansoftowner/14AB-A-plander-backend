import { FilterQuery } from 'mongoose'
import { Repository } from '../base/repository'
import memberModel, { Member } from '../models/member'
import { sanitizeForRegex as s, sanitizeForRegex as s } from '../utils/sanitize'

export class MemberRepository implements Repository {
  count(associationId: string): Promise<number> {
    return memberModel.countDocuments({ association: associationId })
  }

  getByEmail(associationId: string, email: string): Promise<Member | null> {
    return memberModel.findOne({ association: associationId, email })
  }

  getByUsername(associationId: string, username: string): Promise<Member | null> {
    return memberModel.findOne({ association: associationId, username })
  }

  get(
    associationId: string,
    { offset, limit, projection, sort, showUnregistered, searchTerm },
  ): Promise<Member[]> {
    return memberModel
      .find(this.getFilter(associationId, searchTerm, showUnregistered))
      .skip(offset)
      .limit(limit)
      .sort(sort)
      .select(projection)
  }

  private getFilter(
    associationId: string,
    searchTerm: string,
    showUnregistered: boolean,
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
