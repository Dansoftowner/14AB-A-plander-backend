import { FilterQuery } from 'mongoose'
import { Repository } from '../base/repository'
import associationModel, { Association } from '../models/association'
import { sanitizeForRegex as s } from '../utils/sanitize'

export interface AssociationQueryOptions {
  offset?: number
  limit?: number
  sort?: string
  projection?: string
  searchTerm?: string
}

export class AssociationRepository implements Repository {
  async get(
    options: AssociationQueryOptions,
  ): Promise<{ count: number; items: Association[] }> {
    const { offset, limit, sort, projection } = options
    const filter = this.filterQuery(options)

    const count = await associationModel.countDocuments(filter)
    const items = await associationModel
      .find(this.filterQuery(options))
      .skip(offset!)
      .limit(limit!)
      .sort(sort)
      .select(projection!)

    return { count, items }
  }

  async findById(
    id: string,
    { projection }: AssociationQueryOptions,
  ): Promise<Association> {
    return await associationModel.findById(id).select(projection!)
  }

  private filterQuery(options: AssociationQueryOptions) {
    const filterObj: FilterQuery<Association> = {}

    if (options.searchTerm) filterObj.name = new RegExp(s(options.searchTerm), 'i')

    return filterObj
  }
}
