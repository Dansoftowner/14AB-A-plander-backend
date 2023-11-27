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

  SURPASSED_RATE_LIMIT = 'surpassed-rate-limit',
}
