import { Repository } from '../base/repository'
import associationModel, { Association } from '../models/association'
import { sanitizeForRegex as s } from '../utils/sanitize'

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

  findById(id: string, projection: string) {
    return associationModel.findById(id).select(projection)
  }
}
