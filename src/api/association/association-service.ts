import { FilterQuery } from 'mongoose'
import { Service } from '../../base/service'
import { Association } from './association'
import associationModel from './association-model'

export default class AssociationService implements Service {
  async getAssociations({
    offset,
    limit,
    projection,
    sort,
    searchTerm,
  }): Promise<Association[]> {
    const associations = await associationModel
      .find(this.getFilter(searchTerm))
      .skip(offset)
      .limit(limit)
      .sort(sort)
      .select(projection)

    return associations
  }

  private getFilter(searchTerm: string): FilterQuery<Association> {
    return searchTerm
      ? {
          name: {
            $regex: new RegExp(`.*${searchTerm}.*`, 'i'),
          },
        }
      : {}
  }
}
