import { plainToInstance } from 'class-transformer'
import { Service } from '../base/service'
import { MemberItemsDto } from '../dto/member-items'
import { PaginationInfoDto } from '../dto/pagination-info'
import { MemberQueryOptions, MemberRepository } from '../repositories/member'
import { ClientInfo } from '../utils/jwt'
import { CommonQueryOptions } from '../api/common-query-params'
import { MemberDto } from '../dto/member'
import _ from 'lodash'
import { MemberInviteDto } from '../dto/member-invite'
import { TokenService } from './token'
import { MailService } from './mail'
import logger from '../logging/logger'

export class MemberService implements Service {
  private clientInfo: ClientInfo
  private repository: MemberRepository

  private tokenService: TokenService
  private mailService: MailService

  constructor({ clientInfo, memberRepository, tokenService, mailService }) {
    this.repository = memberRepository
    this.clientInfo = clientInfo
    this.tokenService = tokenService
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

  async invite(invitation: MemberInviteDto): Promise<MemberDto | null> {
    const { email } = invitation

    if (await this.emailExists(email)) return null

    const invitedMember = await this.insertIntoDatabase(invitation)

    const token = await this.tokenService.generateRegistrationToken(
      invitedMember._id.toHexString(),
    )

    this.mailService
      .sendRegistrationEmail(invitedMember, token)
      .then((info) => logger.debug(`Registration mail is sent to ${info.envelope.to}.`))
      .catch((err) => logger.debug(`Failed to send registration mail.`, err))

    return plainToInstance(MemberDto, invitedMember, {
      excludeExtraneousValues: true,
    })
  }

  private async emailExists(email: string) {
    return await this.repository.existsWithEmail(email, this.clientInfo.association)
  }

  private async insertIntoDatabase(member: object) {
    member = _.pickBy(member, (it) => it !== undefined)
    member['association'] = this.clientInfo.association
    member['isRegistered'] = false

    return await this.repository.insert(member)
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
