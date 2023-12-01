import { FilterQuery } from 'mongoose'
import { Repository } from '../base/repository'
import memberModel, { Member } from '../models/member'
import { sanitizeForRegex as s } from '../utils/sanitize'

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
    { paginationInfo, projection, sort, searchTerm },
  ): Promise<Member[]> {
    return memberModel
      .find(this.getFilter(associationId, searchTerm))
      .skip(paginationInfo.offset)
      .limit(paginationInfo.limit)
      .sort(sort)
      .select(projection)
  }

  private getFilter(associationId: string, searchTerm: string) {
    const filterObj: FilterQuery<Member> = {
      association: associationId,
    }

    if (searchTerm) {
      filterObj.name = {
        $regex: new RegExp(`.*${s(searchTerm)}.*`, 'i'),
      }
    }
    
    return filterObj
  }
}
