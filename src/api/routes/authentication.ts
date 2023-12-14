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
     *    security: []
     *    description: |
     *       Authenticates the user based on the given credentials.
     *       - It gives back the **authenticated member's data** in the **response body**
     *       - The **authorization token** is provided in the http header called `x-plander-auth`
     *       - **Rate limit: 10 requests per hour.**
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
     *                $ref: '#/components/schemas/Member'
     *        headers:
     *           x-plander-auth:
     *              description: The (JWT) authorization token.
     *              schema:
     *                type: string
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
  }
}
