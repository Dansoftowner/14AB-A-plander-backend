import { ApiErrorCode } from './api-error-codes'

/**
 * @openapi
 * components:
 *    schemas:
 *      Error:
 *        type: object
 *        properties:
 *          status:
 *            type: number
 *            description: Same as the http status code sent with the response.
 *          errorCode:
 *            type: string
 *            description: A special, unique error identifier that might express the problem more precisely than the status code itself.
 *          message:
 *            type: string
 *            description: A localized error message (based on the 'Accept-Language' http header)
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public errorCode: ApiErrorCode,
    message?: string,
  ) {
    super(message)
  }
}
