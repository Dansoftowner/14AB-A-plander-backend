import { Controller } from '../../base/controller'
import AssociationService from './association-service'

export default class AssociationController implements Controller {
  private associationService: AssociationService

  constructor({ associationService }) {
    this.associationService = associationService
  }
}
