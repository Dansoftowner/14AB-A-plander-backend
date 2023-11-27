import { Service } from '../base/service'
import { AssociationItemsDto } from '../dto/association-items'
import { plainToInstance } from 'class-transformer'
import { PaginationInfoDto } from '../dto/pagination-info'
import { AssociationRepository } from '../repositories/association'
import { AssociationDto } from '../dto/association'

export default class AssociationService implements Service {
  private repository: AssociationRepository

  constructor({ associationRepository }) {
    this.repository = associationRepository
  }

  async get(options: {
    paginationInfo: PaginationInfoDto
    projection: string
    sort: string
    searchTerm: string | undefined
  }): Promise<AssociationItemsDto> {
    const items = await this.repository.get(options)
    const total = await this.repository.count()
    const metadata = { ...options.paginationInfo, total }

    return plainToInstance(
      AssociationItemsDto,
      { metadata, items },
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      },
    )
  }

  async getById(id: string, projection: string): Promise<AssociationDto | null> {
    const item = await this.repository.findById(id, projection)
    return plainToInstance(AssociationDto, item, {
      excludeExtraneousValues: true,
    })
  }
}
