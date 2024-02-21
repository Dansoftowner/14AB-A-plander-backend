import { NextFunction, Request, Response } from 'express'
import { ApiErrorCode } from '../api/error/api-error-codes'
import { ApiError } from '../api/error/api-error'
import { ClientInfo } from '../utils/jwt'

export default (req: Request, res: Response, next: NextFunction) => {
  const clientInfo: ClientInfo = req.scope!.resolve('clientInfo')
  if (!clientInfo.hasRole('president'))
    throw new ApiError(403, ApiErrorCode.NOT_PRESIDENT)

  next()
}
