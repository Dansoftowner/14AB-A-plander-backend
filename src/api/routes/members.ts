import { RoutesProvider } from '../../base/routes-provider'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import auth from '../../middlewares/auth'
import { MemberController } from '../controllers/member'

export class MemberRoutes extends RoutesProvider {
  constructor({ memberController }) {
    super(memberController)
  }

  override initializeRoutes(controller: MemberController) {
    this.router.get(
      '/members',
      auth,
      asyncErrorHandler((req, res) => controller.getMembers(req, res)),
    )
  }
}
