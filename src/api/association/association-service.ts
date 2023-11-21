import { FilterQuery } from 'mongoose'
import { Service } from '../../base/service'
import { Association } from './association'
import associationModel from './association-model'

export default class AssociationService implements Service {
  getCount(): Promise<number> {
    return associationModel.countDocuments()
  }

  getAll({
    offset,
    limit,
    projection,
    sort,
    searchTerm,
  }): Promise<Association[]> {
    return associationModel
      .find(this.getFilter(searchTerm))
      .skip(offset)
      .limit(limit)
      .sort(sort)
      .select(projection)
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
