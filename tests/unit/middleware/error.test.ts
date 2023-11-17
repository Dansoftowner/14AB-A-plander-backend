import { NextFunction, Request, Response } from 'express'
import errorMiddleware from '../../../src/middleware/error-middleware'

describe('error middleware', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {}
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    }
    next = jest.fn()
  })

  it('should return 500 message if there is a general error', () => {
    errorMiddleware(new Error(), req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalled()
  })
})
