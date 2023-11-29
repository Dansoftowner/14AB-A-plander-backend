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
     *        description: |
     *           Authentication successful.
     *           - Returns the JWT in an httpOnly _cookie_ named 'plander_auth'.
     *           - In order to support native applications, the response will include the token in the body as well.
     *        content:
     *          application/json:
     *            schema:
     *                type: string
     *                description: The (JWT) token.
     *                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.Et9HFtf9R3GEMA0IICOfFMVXY7kkTX1wr4qCyhIf58U'
     *      400:
     *        $ref: '#/components/responses/InvalidPayload'
     *      401:
     *        $ref: '#/components/responses/WrongCredentials'
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
