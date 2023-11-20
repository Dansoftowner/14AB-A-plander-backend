import { Service } from '../../base/service'
import { Association } from './association'
import associationModel from './association-model'

export default class AssociationService implements Service {
  getAssociations(
    offset: number = 0,
    limit: number = 10,
    projection: string = 'lite',
    orderBy: string = 'name',
    q: string = '',
  ): Association[] {
    return associationModel.find({}) as unknown as Association[]
  }
}
