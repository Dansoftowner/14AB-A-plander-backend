import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../exception/api-error'
import { ApiErrorCode } from '../exception/api-error-codes'
import logger from '../logging/logger'

const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ApiError) {
    if (!err.message) err.message = req.t(err.errorCode, { ns: 'errors' })
    return res.status(err.status).json(err)
  }

  logger.error('Internal server error occured', err)

  errorMiddleware(new ApiError(500, ApiErrorCode.INTERNAL_SERVER_ERROR), req, res, next)
}

export default errorMiddleware
