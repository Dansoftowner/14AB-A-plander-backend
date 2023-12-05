import { plainToInstance } from 'class-transformer'
import { Service } from '../base/service'
import { MemberItemsDto } from '../dto/member-items'
import { PaginationInfoDto } from '../dto/pagination-info'
import { MemberQueryOptions, MemberRepository } from '../repositories/member'
import { ClientInfo } from '../utils/jwt'
import { CommonQueryOptions } from '../api/common-query-params'
import { MemberDto } from '../dto/member'

export class MemberService implements Service {
  private clientInfo: ClientInfo
  private repository: MemberRepository

  constructor({ clientInfo, memberRepository }) {
    this.repository = memberRepository
    this.clientInfo = clientInfo
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

  private dbOptions(
    options: CommonQueryOptions,
    requestedId: string | undefined = undefined,
  ): MemberQueryOptions {
    return {
      ...options,
      associationId: this.clientInfo.association,
      projection: this.adjustProjection(options.projection, requestedId),
      sort: options.sort || 'name',
      showUnregistered: this.clientInfo.roles.includes('president'),
    }
  }

  private adjustProjection(
    projection: 'lite' | 'full',
    requestedId: string | undefined = undefined,
  ): string {
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

    return visibleFields.join(' ')
  }
}
