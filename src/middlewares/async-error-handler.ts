import { NextFunction, Request, Response } from 'express'

/**
 * A wrapper function for async route handlers: passes the potentially occuring error
 * to the next middleware (ideally the error-handling middleware)
 */
export default (handler: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next)
    } catch (e) {
      next(e)
    }
  }
}
