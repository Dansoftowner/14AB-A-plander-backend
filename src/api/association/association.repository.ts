import { Repository } from '../../base/repository'
import associationModel from './association.model'
import { sanitizeForRegex as s } from '../../utils/sanitize'
import { Association } from './association.interface'

export class AssociationRepository implements Repository {
  count(): Promise<number> {
    return associationModel.countDocuments()
  }

  get({ paginationInfo, projection, sort, searchTerm }): Promise<Association[]> {
    return associationModel
      .find(this.getFilter(searchTerm))
      .skip(paginationInfo.offset)
      .limit(paginationInfo.limit)
      .sort(sort)
      .select(projection)
  }

  private getFilter(searchTerm: string) {
    return searchTerm
      ? {
          name: {
            $regex: new RegExp(`.*${s(searchTerm)}.*`, 'i'),
          },
        }
      : {}
  }
}
