import { plainToInstance } from 'class-transformer'
import { Service } from '../base/service'
import { MemberItemsDto } from '../dto/member-items'
import { PaginationInfoDto } from '../dto/pagination-info'
import { MemberRepository } from '../repositories/member'
import { ClientInfo } from '../utils/jwt'
import { CommonQueryOptions } from '../api/common-query-params'

export class MemberService implements Service {
  private clientInfo: ClientInfo
  private repository: MemberRepository

  private get associationId(): string {
    return this.clientInfo.association
  }

  constructor({ clientInfo, memberRepository }) {
    this.repository = memberRepository
    this.clientInfo = clientInfo
  }

  async get(options: CommonQueryOptions): Promise<MemberItemsDto> {
    const items = await this.repository.get(this.associationId, this.dbOptions(options))
    const total = await this.repository.count(this.associationId)
    const metadata = { offset: options.offset, limit: options.limit, total }

    return plainToInstance(
      MemberItemsDto,
      { metadata, items },
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      },
    )
  }

  private dbOptions(options: CommonQueryOptions) {
    return {
      ...options,
      projection: this.adjustProjection(options.projection),
      sort: options.sort || 'name',
      showUnregistered: this.clientInfo.roles.includes('president'),
    }
  }

  private adjustProjection(projection: 'lite' | 'full'): string {
    const visibleFields = [
      '_id',
      'isRegistered',
      'username',
      'name',
      'email',
      'phoneNumber',
      'roles',
    ]

    if (projection == 'full' && this.clientInfo.roles.includes('president'))
      visibleFields.push('guardNumber', 'address', 'idNumber')

    return visibleFields.join(' ')
  }
}
