import { Service } from '../base/service'
import { CredentialsDto } from '../dto/credentials'
import bcrypt from 'bcrypt'
import { generateToken } from '../utils/jwt'
import { MemberRepository } from '../repositories/member'
import { isEmail } from '../utils/common-regex'

export class AuthenticationService implements Service {
  private repository: MemberRepository

  constructor({ memberRepository }) {
    this.repository = memberRepository
  }

  async auth(credentials: CredentialsDto): Promise<string | null> {
    const member = await this.retrieveMember(credentials)

    if (!member) return null

    const validPassword = await bcrypt.compare(credentials.password, member.password)
    if (!validPassword) return null

    return generateToken(member)
  }

  private async retrieveMember({ associationId, user }) {
    if (isEmail(user)) return this.repository.findByEmail(user, { associationId })
    return this.repository.findByUsername(user, { associationId })
  }
}
