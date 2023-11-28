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
   *        description: "The given data does not meet the validation requirements (errorCode: 'invalid-payload')."
   *        content:
   *          application/json:
   *            schema:
   *             $ref: '#/components/schemas/Error'
   */
  INVALID_PAYLOAD = 'invalid-payload', // TODO: internationalize

  /**
   * @openapi
   * components:
   *    responses:
   *      WrongCredentials:
   *        description: "Invalid username or password (errorCode: 'wrong-credentials')."
   *        content:
   *          application/json:
   *            schema:
   *             $ref: '#/components/schemas/Error'
   */
  WRONG_CREDENTIALS = 'wrong-credentials', // TODO: internationalize
}
