import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'
import { ApiError } from '../exception/api-error'
import { ApiErrorCode } from '../exception/api-error-codes'

export default (req: Request, res: Response, next: NextFunction) => {
  if (!Types.ObjectId.isValid(req.params.id))
    return res.status(400).json(
      new ApiError(
        400,
        ApiErrorCode.INVALID_OBJECT_ID,
        'The id has invalid format!', // TODO: internationalization
      ),
    )
  next()
}
