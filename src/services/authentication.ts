import { FilterQuery } from 'mongoose'
import { Service } from '../base/service'
import { CredentialsDto } from '../dto/credentials'
import memberModel, { Member } from '../models/member'
import bcrypt from 'bcrypt'
import { generateToken } from '../utils/jwt'
import { MemberRepository } from '../repositories/member'

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
    if (user.includes('@')) return this.repository.getByEmail(associationId, user)
    return this.repository.getByUsername(associationId, user)
  }
}
