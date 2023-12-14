import { NextFunction, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { MemoryStore } from 'express-rate-limit'
import { ApiError } from '../api/error/api-error'
import { ApiErrorCode } from '../api/error/api-error-codes'

/**
 * Exported for testing environment
 */
export const rateLimiterStore = new MemoryStore()
export const loginRateLimiterStore = new MemoryStore()

const handler = (req: Request, res: Response, next: NextFunction) => {
  throw new ApiError(429, ApiErrorCode.SURPASSED_RATE_LIMIT)
}

export default rateLimit({
  windowMs: 1000,
  limit: 100,
  standardHeaders: true,
  store: rateLimiterStore,
  validate: {
    xForwardedForHeader: false,
  },
  handler,
})

export const loginRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  store: loginRateLimiterStore,
  validate: {
    xForwardedForHeader: false,
  },
  handler,
})
