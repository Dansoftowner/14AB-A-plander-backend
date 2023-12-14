import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'
import { ApiError } from '../api/error/api-error'
import { ApiErrorCode } from '../api/error/api-error-codes'

export const validateObjectId = (apiError: ApiError) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!Types.ObjectId.isValid(req.params.id)) throw apiError
    next()
  }
}

export default validateObjectId(new ApiError(400, ApiErrorCode.INVALID_OBJECT_ID))
