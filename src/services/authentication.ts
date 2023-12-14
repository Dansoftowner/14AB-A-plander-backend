import { Service } from '../base/service'
import { CredentialsDto } from '../dto/credentials'
import bcrypt from 'bcrypt'
import { generateToken } from '../utils/jwt'
import { MemberRepository } from '../repositories/member'
import { isEmail } from '../utils/common-regex'
import { MemberDto } from '../dto/member'
import { plainToInstance } from 'class-transformer'
import { Member } from '../models/member'

export type AuthenticationResult = {
  member: MemberDto
  token: string
}

export class AuthenticationService implements Service {
  private repository: MemberRepository

  constructor({ memberRepository }) {
    this.repository = memberRepository
  }

  async auth(credentials: CredentialsDto): Promise<AuthenticationResult | null> {
    let member: Member | MemberDto | null = await this.retrieveMember(credentials)

    if (!member) return null

    const validPassword = await bcrypt.compare(credentials.password, member.password)
    if (!validPassword) return null

    const token = generateToken(member)
    member = plainToInstance(MemberDto, member, { excludeExtraneousValues: true })

    return { member, token }
  }

  private retrieveMember({ associationId, user }): Promise<Member | null> {
    if (isEmail(user)) return this.repository.findByEmail(user, { associationId })
    return this.repository.findByUsername(user, { associationId })
  }
}
