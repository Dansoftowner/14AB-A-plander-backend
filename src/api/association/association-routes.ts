import { RoutesProvider } from '../../base/routes-provider'
import asyncErrorHandler from '../../middleware/async-error-handler'
import AssociationController from './association-controller'

export default class AssocationRoutes extends RoutesProvider {
  constructor({ associationController }) {
    super(associationController)
  }

  protected initializeRoutes(controller: AssociationController) {
    this.router.get(
      '/associations',
      asyncErrorHandler((req, res) => controller.getAssociations(req, res)),
    )
  }
}
