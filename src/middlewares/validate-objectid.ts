import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'
import { ApiError } from '../api/error/api-error'
import { ApiErrorCode } from '../api/error/api-error-codes'

export default (req: Request, res: Response, next: NextFunction) => {
  if (!Types.ObjectId.isValid(req.params.id))
    throw new ApiError(400, ApiErrorCode.INVALID_OBJECT_ID)
  next()
}
