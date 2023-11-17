import { ApiErrorCode } from './api-error-codes'

export class ApiError extends Error {
  constructor(
    public status: number,
    public errorCode: ApiErrorCode,
    public message: string,
  ) {
    super(message)
  }
}
