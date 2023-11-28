import { Repository } from '../base/repository'
import memberModel, { Member } from '../models/member'

export class MemberRepository implements Repository {
  count(): Promise<number> {
    return memberModel.countDocuments()
  }

  async getByEmail(associationId: string, email: string): Promise<Member | null> {
    return memberModel.findOne({ association: associationId, email })
  }

  async getByUsername(associationId: string, username: string): Promise<Member | null> {
    return memberModel.findOne({ association: associationId, username })
  }
}
