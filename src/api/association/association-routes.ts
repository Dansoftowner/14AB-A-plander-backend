import { RoutesProvider } from '../../base/routes-provider'
import AssociationController from './association-controller'

export default class AssocationRoutes extends RoutesProvider {
  constructor({ associationController }) {
    super(associationController)
  }

  protected initializeRoutes(associationController: AssociationController) {}
}
