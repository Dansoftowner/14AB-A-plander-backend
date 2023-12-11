import { RoutesProvider } from '../../base/routes-provider'
import { AuthenticationController } from '../controllers/authentication'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import validate from '../../middlewares/validate'
import { CredentialsDto } from '../../dto/credentials'
import rateLimiter, { loginRateLimiter } from '../../middlewares/rate-limiter'

export class AuthenticationRoutes extends RoutesProvider {
  private get loginRateLimiter() {
    return process.env.NODE_ENV === 'development' ? rateLimiter : loginRateLimiter
  }

  constructor({ authenticationController }) {
    super(authenticationController)
  }

  public override get isRateLimited(): boolean {
    return true
  }

  protected initializeRoutes(controller: AuthenticationController): void {
    /**
     * @openapi
     * /api/auth:
     *  post:
     *    tags:
     *      - Authentication
     *    description: |
     *       Authenticates the user based on the given credentials.
     *       - **Rate limit: 10 requests per hour.**
     *       - Returns the JWT in an httpOnly _cookie_ named 'plander_auth'.
     *       - In order to support native applications, **the token is included in the response body as well**.
     *    requestBody:
     *      required: true
     *      content:
     *       application/json:
     *        schema:
     *         $ref: '#/components/schemas/Credentials'
     *    responses:
     *      200:
     *        description: Authentication successful.
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
      this.loginRateLimiter,
      validate(CredentialsDto.validationSchema()),
      asyncErrorHandler((req, res) => controller.auth(req, res)),
    )

    /**
     * @openapi
     * /api/logout:
     *  post:
     *    tags:
     *      - Authentication
     *    description: '**Only relevant for web applications:** removes the token cookie.'
     *    responses:
     *      204:
     *        description: Successfully logged out. **Nothing is returned.**
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.post(
      '/logout',
      rateLimiter,
      asyncErrorHandler((req, res) => controller.logout(req, res)),
    )
  }
}
