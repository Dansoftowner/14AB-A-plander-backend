import express from 'express'
import request from 'supertest'
import config from 'config'
import jwt from 'jsonwebtoken'
import i18n from '../../../src/middlewares/i18n'
import auth from '../../../src/middlewares/auth'
import errorMiddleware from '../../../src/middlewares/error'

describe('auth middleware', () => {
  const app = express()
  const routeHandler = jest.fn()

  beforeAll(() => {
    app.use(i18n)
    app.get('/test', auth, routeHandler)
    app.use(errorMiddleware)
  })

  let mockMember: object
  let cookie: string | undefined
  let header: string | undefined

  const sendRequest = () => {
    const req = request(app).get('/test')
    if (cookie) req.set('Cookie', `${config.get('jwt.cookieName')}=${cookie}`)
    if (header) req.set(config.get('jwt.headerName'), header)
    return req
  }

  const generateToken = (secret: string = config.get('jwt.privateKey')) => {
    return jwt.sign(mockMember, secret)
  }

  beforeEach(() => {
    routeHandler.mockClear()
    mockMember = { _id: '123' }
    header = cookie = undefined
  })

  it('should return 401 message if no token provided', async () => {
    const res = await sendRequest()

    expect(res.status).toBe(401)
    expect(routeHandler).not.toHaveBeenCalled()
  })

  it('should return 400 message if invalid token provided in cookie', async () => {
    cookie = generateToken('invalid-secret')

    const res = await sendRequest()

    expect(res.status).toBe(400)
    expect(routeHandler).not.toHaveBeenCalled()
  })

  it('should return 400 message if invalid token provided in header', async () => {
    header = generateToken('invalid-secret')

    const res = await sendRequest()

    expect(res.status).toBe(400)
    expect(routeHandler).not.toHaveBeenCalled()
  })
})
