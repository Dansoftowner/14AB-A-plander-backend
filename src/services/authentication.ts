import { Service } from '../base/service'
import { CredentialsDto } from '../dto/credentials'
import bcrypt from 'bcrypt'
import { generateToken } from '../utils/jwt'
import { MemberRepository } from '../repositories/member'
import { isEmail } from '../utils/common-regex'
import { MemberDto } from '../dto/member'
import { plainToInstance } from 'class-transformer'
import { Member } from '../models/member'
import mongoose from 'mongoose'

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

    if (!(await this.compare(member, credentials))) return null

    const token = generateToken(member!)
    member = plainToInstance(MemberDto, member, { excludeExtraneousValues: true })

    return { member, token }
  }

  async authWithoutToken(credentials: CredentialsDto): Promise<boolean> {
    const member = await this.retrieveMember(credentials)
    return this.compare(member, credentials)
  }

  private async compare(
    member: Member | null,
    credentials: CredentialsDto,
  ): Promise<boolean> {
    if (!member) return false
    return await bcrypt.compare(credentials.password, member.password!)
  }

  private retrieveMember({ associationId, user }): Promise<Member | null> {
    if (mongoose.Types.ObjectId.isValid(user))
      return this.repository.findById(user, { associationId })
    if (isEmail(user)) return this.repository.findByEmail(user, { associationId })
    return this.repository.findByUsername(user, { associationId })
  }
}
