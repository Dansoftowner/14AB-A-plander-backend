import { plainToInstance } from 'class-transformer'
import { Service } from '../base/service'
import { MemberItemsDto } from '../dto/member-items'
import { MemberQueryOptions, MemberRepository } from '../repositories/member'
import { ClientInfo } from '../utils/jwt'
import { CommonQueryOptions } from '../api/common-query-params'
import { MemberDto } from '../dto/member'
import _ from 'lodash'
import { MemberInviteDto } from '../dto/member-invite'
import { MailService } from './mail'
import logger from '../logging/logger'
import { MemberRegistrationDto } from '../dto/member-registration'

export class MemberService implements Service {
  private clientInfo: ClientInfo
  private repository: MemberRepository

  private mailService: MailService

  constructor({ clientInfo, memberRepository, mailService }) {
    this.repository = memberRepository
    this.clientInfo = clientInfo
    this.mailService = mailService
  }

  async get(options: CommonQueryOptions): Promise<MemberItemsDto> {
    const { count, items } = await this.repository.get(this.dbOptions(options))

    const metadata = { offset: options.offset, limit: options.limit, total: count }

    return plainToInstance(
      MemberItemsDto,
      { metadata, items },
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      },
    )
  }

  async getById(id: string, options: CommonQueryOptions): Promise<MemberDto | null> {
    const item = await this.repository.findById(id, this.dbOptions(options, id))

    return plainToInstance(MemberDto, item, {
      excludeExtraneousValues: true,
    })
  }

  async getByUsername(
    username: string,
    options: CommonQueryOptions,
  ): Promise<MemberDto | null> {
    const dbOptions = {
      ...options,
      associationId: this.clientInfo.association,
      projection: '-preferences',
    }

    let item = await this.repository.findByUsername(username, dbOptions)
    if (item)
      item = _.pick(
        item,
        this.adjustProjection(options.projection, item._id.toHexString()),
      )

    return plainToInstance(MemberDto, item, {
      excludeExtraneousValues: true,
    })
  }

  async getInvited(id: string, registrationToken: string): Promise<MemberDto | null> {
    const item = this.repository.findByRegistrationToken(id, registrationToken)

    return plainToInstance(MemberDto, item, { excludeExtraneousValues: true })
  }

  async invite(invitation: MemberInviteDto): Promise<MemberDto | null> {
    const { email } = invitation

    if (await this.emailExists(email)) return null

    const { invitedMember, token } = await this.insertIntoDatabase(invitation)

    this.mailService
      .sendRegistrationEmail(invitedMember, token)
      .then((info) => logger.debug(`Registration mail is sent to ${info.envelope.to}.`))
      .catch((err) => logger.debug(`Failed to send registration mail.`, err))

    return plainToInstance(MemberDto, invitedMember, {
      excludeExtraneousValues: true,
    })
  }

  async register(
    id: string,
    token: string,
    registration: MemberRegistrationDto,
  ): Promise<MemberDto | null | undefined> {
    const updatedMember = await this.registerInvitedMemberInDb(id, token, registration)

    if (!updatedMember) return updatedMember

    return plainToInstance(MemberDto, updatedMember, { excludeExtraneousValues: true })
  }

  private async emailExists(email: string) {
    return await this.repository.existsWithEmail(email, this.clientInfo.association)
  }

  private insertIntoDatabase(invitation: MemberInviteDto) {
    let member = {
      ...invitation,
      association: this.clientInfo.association,
      isRegistered: false,
    }

    member = _.pickBy(member, (it) => it !== undefined)

    return this.repository.invite(member)
  }

  private async registerInvitedMemberInDb(
    id: string,
    token: string,
    registration: object,
  ) {
    let member = {
      _id: id,
      isRegistered: true,
      ...registration,
    }

    member = _.pickBy(member, (it) => it !== undefined)

    try {
      return await this.repository.register(member, token)
    } catch (ex: any) {
      // if unique values are duplicated, mongoose will throw an error that has a property 'code' with the value of '11000'
      if (ex.code == 11000) return undefined
      throw ex
    }
  }

  private dbOptions(
    options: CommonQueryOptions,
    requestedId: string | undefined = undefined,
  ): MemberQueryOptions {
    return {
      ...options,
      associationId: this.clientInfo.association,
      projection: this.adjustProjection(options.projection, requestedId).join(' '),
      sort: options.sort || 'name',
      showUnregistered: this.clientInfo.roles.includes('president'),
    }
  }

  private adjustProjection(
    projection: 'lite' | 'full',
    requestedId: string | undefined = undefined,
  ): string[] {
    const visibleFields = [
      '_id',
      'isRegistered',
      'username',
      'name',
      'email',
      'phoneNumber',
      'roles',
    ]

    const isPermittedForMore =
      projection == 'full' &&
      (this.clientInfo.hasRole('president') || this.clientInfo._id == requestedId)

    if (isPermittedForMore) visibleFields.push('guardNumber', 'address', 'idNumber')

    return visibleFields
  }
}
