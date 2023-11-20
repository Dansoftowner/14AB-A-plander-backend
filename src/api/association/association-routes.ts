import { RoutesProvider } from '../../base/routes-provider'
import asyncHandler from '../../middleware/async-handler'
import AssociationController from './association-controller'

export default class AssocationRoutes extends RoutesProvider {
  constructor({ associationController }) {
    super(associationController)
  }

  protected initializeRoutes(controller: AssociationController) {
    this.router.get('/api/associations', asyncHandler(controller.getAssociations))
  }
}
