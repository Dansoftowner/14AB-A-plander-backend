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
    /**
     * @openapi
     * /api/auth:
     *  post:
     *    tags:
     *      - Authentication
     *    description: Authenticates the user based on the given credentials.
     *    requestBody:
     *      required: true
     *      content:
     *       application/json:
     *        schema:
     *         $ref: '#/components/schemas/Credentials'
     *    responses:
     *      200:
     *        description: Associations fetched successfully.
     *        content:
     *          application/json:
     *            schema:
     *                type: string
     *                description: The (JWT) token (it is relevant for native apps only).
     *
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.post(
      '/auth',
      validate(CredentialsDto.validationSchema()),
      asyncErrorHandler((req, res) => controller.auth(req, res)),
    )
  }
}
