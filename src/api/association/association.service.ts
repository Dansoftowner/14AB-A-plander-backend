import { FilterQuery } from 'mongoose'
import { Service } from '../../base/service'
import { Association } from './association.interface'

import { AssociationItemsDto } from './association-items.dto'
import { plainToInstance } from 'class-transformer'
import { PaginationInfoDto } from '../pagination-info.dto'
import { AssociationRepository } from './association.repository'

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
}
