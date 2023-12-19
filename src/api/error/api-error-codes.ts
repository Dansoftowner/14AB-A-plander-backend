export enum ApiErrorCode {
  /**
   * @openapi
   * components:
   *    responses:
   *      InternalServerError:
   *        description: "Unexpected error (errorCode: 'internal-server-error')."
   *        content:
   *          application/json:
   *           schema:
   *            $ref: '#/components/schemas/Error'
   */
  INTERNAL_SERVER_ERROR = 'internal-server-error',

  /**
   * @openapi
   * components:
   *    responses:
   *      InvalidObjectId:
   *        description: "The given id has invalid format (errorCode: 'invalid-object-id')."
   *        content:
   *          application/json:
   *           schema:
   *            $ref: '#/components/schemas/Error'
   */
  INVALID_OBJECT_ID = 'invalid-object-id',

  /**
   * @openapi
   * components:
   *    responses:
   *      NotFound:
   *        description: "The specified resource was not found (errorCode: 'missing-resource')."
   *        content:
   *          application/json:
   *            schema:
   *             $ref: '#/components/schemas/Error'
   */
  MISSING_RESOURCE = 'missing-resource',

  /**
   * @openapi
   * components:
   *    responses:
   *      SurpassedRateLimit:
   *        description: "Too many requests in short period of time (errorCode: 'surpassed-rate-limit')."
   *        content:
   *          application/json:
   *            schema:
   *             $ref: '#/components/schemas/Error'
   */
  SURPASSED_RATE_LIMIT = 'surpassed-rate-limit',

  /**
   * @openapi
   * components:
   *    responses:
   *      InvalidPayload:
   *        description: "Some of the required fields are missing or invalid (errorCode: 'invalid-payload')."
   *        content:
   *          application/json:
   *            schema:
   *             $ref: '#/components/schemas/Error'
   */
  INVALID_PAYLOAD = 'invalid-payload',

  /**
   * @openapi
   * components:
   *    responses:
   *      WrongCredentials:
   *        description: "Invalid username/password or maybe the association doesn't exist (errorCode: 'wrong-credentials')."
   *        content:
   *          application/json:
   *            schema:
   *             $ref: '#/components/schemas/Error'
   */
  WRONG_CREDENTIALS = 'wrong-credentials',

  /**
   * @openapi
   * components:
   *    responses:
   *      Unauthorized:
   *        description: "No token provided (errorCode: 'unauthorized')."
   *        content:
   *          application/json:
   *            schema:
   *             $ref: '#/components/schemas/Error'
   */
  UNAUTHORIZED = 'unauthorized',

  /**
   * @openapi
   * components:
   *    responses:
   *      InvalidToken:
   *        description: "The provided token is invalid (errorCode: 'invalid-token')."
   *        content:
   *          application/json:
   *            schema:
   *             $ref: '#/components/schemas/Error'
   */
  INVALID_TOKEN = 'invalid-token',

  /**
   * @openapi
   * components:
   *    responses:
   *      NotPresident:
   *        description: "The given action is only permitted for presidents (errorCode: 'not-president')."
   *        content:
   *          application/json:
   *            schema:
   *             $ref: '#/components/schemas/Error'
   */
  NOT_PRESIDENT = 'not-president',

  /**
   * @openapi
   * components:
   *    responses:
   *      EmailReserved:
   *        description: "The given email is already in use. (errorCode: 'email-reserved')."
   *        content:
   *          application/json:
   *            schema:
   *             $ref: '#/components/schemas/Error'
   */
  EMAIL_RESERVED = 'email-reserved',

  /**
   * @openapi
   * components:
   *    responses:
   *      UsernameIdNumberReserved:
   *        description: "The given username/id number is already in use. (errorCode: 'username-id-number-reserved')."
   *        content:
   *          application/json:
   *            schema:
   *             $ref: '#/components/schemas/Error'
   */
  USERNAME_ID_NUMBER_RESERVED = 'username-id-number-reserved',

  /**
   * @openapi
   * components:
   *    responses:
   *      UsernameReserved:
   *        description: "The given username is already in use inside the association. (errorCode: 'username-reserved')."
   *        content:
   *          application/json:
   *            schema:
   *             $ref: '#/components/schemas/Error'
   */
  USERNAME_RESERVED = 'username-reserved',

  /**
   * @openapi
   * components:
   *   responses:
   *    InvalidURL:
   *     description: "The given id-token pair is invalid (errorCode: 'invalid-url')."
   *     content:
   *       application/json:
   *         schema:
   *           $ref: '#/components/schemas/Error'
   */
  INVALID_URL = 'invalid-url',

  /**
   * @openapi
   * components:
   *   responses:
   *    CurrentPassRequired:
   *     description: "The current password must be provided in the header to perform this operation (errorCode: 'current-pass-required')."
   *     content:
   *       application/json:
   *         schema:
   *           $ref: '#/components/schemas/Error'
   */
  CURRENT_PASS_REQUIRED = 'current-pass-required',

  /**
   * @openapi
   * components:
   *   responses:
   *    CurrentPassRequired:
   *     description: "The provided password is invalid (errorCode: 'current-pass-invalid')."
   *     content:
   *       application/json:
   *         schema:
   *           $ref: '#/components/schemas/Error'
   */
  CURRENT_PASS_INVALID = 'current-pass-invalid',

  /**
   * @openapi
   * components:
   *   responses:
   *    EmailNotFound:
   *     description: "The provided email does not exist (errorCode: 'email-not-found')."
   *     content:
   *       application/json:
   *         schema:
   *           $ref: '#/components/schemas/Error'
   */
  EMAIL_NOT_FOUND = 'email-not-found',
}
