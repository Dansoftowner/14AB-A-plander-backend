import { NextFunction, Request, Response } from 'express'
import errorMiddleware from '../../../src/middlewares/error'
import { ApiError } from '../../../src/api/error/api-error'
import { ApiErrorCode } from '../../../src/api/error/api-error-codes'

describe('error middleware', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      t: jest.fn().mockReturnValue('i18n'),
    }
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

  it('should internationalize message if ApiError with no custom message is passed', () => {
    const apiError = new ApiError(400, 'e' as unknown as ApiErrorCode)

    errorMiddleware(apiError, req, res, next)

    expect(req.t.mock.calls[0][0]).toBe(apiError.errorCode)
    expect(res.json.mock.calls[0][0]).toHaveProperty('message', 'i18n')
  })
})
