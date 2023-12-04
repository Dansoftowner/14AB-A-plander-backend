import { plainToInstance } from 'class-transformer'
import { Service } from '../base/service'
import { MemberItemsDto } from '../dto/member-items'
import { PaginationInfoDto } from '../dto/pagination-info'
import { MemberRepository } from '../repositories/member'
import { ClientInfo } from '../utils/jwt'

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

  async get(options: {
    paginationInfo: PaginationInfoDto
    projection: string
    sort: string
    searchTerm: string | undefined
  }): Promise<MemberItemsDto> {
    const items = await this.repository.get(this.associationId, options)
    const total = await this.repository.count(this.associationId)
    const metadata = { ...options.paginationInfo, total }

    return plainToInstance(
      MemberItemsDto,
      { metadata, items },
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      },
    )
  }
}
