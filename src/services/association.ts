import { Service } from '../base/service'
import { AssociationItemsDto } from '../dto/association/association-items'
import { plainToInstance } from 'class-transformer'
import {
  AssociationQueryOptions,
  AssociationRepository,
} from '../repositories/association'
import { AssociationDto } from '../dto/association/association'
import { CommonQueryOptions } from '../api/params/common-query-params'

export default class AssociationService implements Service {
  constructor(private associationRepository: AssociationRepository) {}

  async get(options: CommonQueryOptions): Promise<AssociationItemsDto> {
    const { count, items } = await this.associationRepository.get(
      this.dbOptions(options),
    )

    const metadata = { offset: options.offset, limit: options.limit, total: count }

    return plainToInstance(
      AssociationItemsDto,
      { metadata, items },
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      },
    )
  }

  async getById(
    id: string,
    options: CommonQueryOptions,
  ): Promise<AssociationDto | null> {
    const item = await this.associationRepository.findById(id, this.dbOptions(options))

    return plainToInstance(AssociationDto, item, {
      excludeExtraneousValues: true,
    })
  }

  private dbOptions(options: CommonQueryOptions): AssociationQueryOptions {
    return {
      ...options,
      projection: this.adjustProjection(options.projection).join(' '),
      sort: options.sort || 'name',
    }
  }

  private adjustProjection(projection: 'lite' | 'full'): string[] {
    const visibleFields = ['_id', 'name']

    if (projection == 'full') visibleFields.push('location', 'certificate')

    return visibleFields
  }
}
