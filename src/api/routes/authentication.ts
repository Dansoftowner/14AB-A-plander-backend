import { RoutesProvider } from '../../base/routes-provider'
import { AuthenticationController } from '../controllers/authentication'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import validate from '../../middlewares/validate'
import { CredentialsDto } from '../../dto/credentials'

export class AuthenticationRoutes extends RoutesProvider {
  constructor({ authenticationController }) {
    super(authenticationController)
  }

  protected initializeRoutes(controller: AuthenticationController): void {
    this.router.post(
      '/auth',
      validate(CredentialsDto.validationSchema()),
      asyncErrorHandler((req, res) => controller.auth(req, res)),
    )
  }
}
