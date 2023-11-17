import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../exception/api-error'

export default (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
    
}
