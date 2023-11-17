import { NextFunction, Request, Response } from 'express'
import errorMiddleware from '../../../src/middleware/error-middleware'
import { ApiError } from '../../../src/exception/api-error'
import { ApiErrorCode } from '../../../src/exception/api-error-codes'

describe('error middleware', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {}
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    next = jest.fn()
  })

  it('should return 500 message if a general error is passed', () => {
    errorMiddleware(new Error(), req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalled()
  })

  it('should return custom message if an ApiError is passed', () => {
    const apiError = new ApiError(400, 'e' as unknown as ApiErrorCode, 'msg')

    errorMiddleware(apiError, req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(apiError)
  })
})
