import express from 'express'
import request from 'supertest'
import config from 'config'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import i18n from '../../../src/middlewares/i18n'
import auth from '../../../src/middlewares/auth'
import errorMiddleware from '../../../src/middlewares/error'

describe('auth middleware', () => {
  const app = express()
  const routeHandler = jest.fn()

  const initializeApp = () => {
    app.use(i18n)
    app.use(cookieParser())
    app.get('/test', auth, (req, res) => {
      routeHandler(req, res)
      res.status(200).send()
    })
    app.use(errorMiddleware)
  }

  beforeAll(() => {
    initializeApp()
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
    mockMember = { id: '123' }
    header = cookie = generateToken()
  })

  it('should return 401 message if no token provided', async () => {
    header = cookie = undefined

    const res = await sendRequest()

    expect(res.status).toBe(401)
    expect(routeHandler).not.toHaveBeenCalled()
  })

  it('should return 400 message if invalid token provided in cookie', async () => {
    cookie = generateToken('invalid-secret')
    header = undefined

    const res = await sendRequest()

    expect(res.status).toBe(400)
    expect(routeHandler).not.toHaveBeenCalled()
  })

  it('should return 400 message if invalid token provided in header', async () => {
    header = generateToken('invalid-secret')
    cookie = undefined

    const res = await sendRequest()

    expect(res.status).toBe(400)
    expect(routeHandler).not.toHaveBeenCalled()
  })

  it('should return 200 message if valid token provided in cookie', async () => {
    header = undefined

    const res = await sendRequest()

    expect(res.status).toBe(200)
    expect(routeHandler).toHaveBeenCalled()
  })

  it('should return 200 message if valid token provided in header', async () => {
    cookie = undefined

    const res = await sendRequest()

    expect(res.status).toBe(200)
    expect(routeHandler).toHaveBeenCalled()
  })

  it('should set the member info in the request scope', async () => {
    const res = await sendRequest()

    const diScope = routeHandler.mock.calls[0][0].scope

    expect(res.status).toBe(200)
    expect(routeHandler).toHaveBeenCalled()
    expect(diScope).toBeDefined()
    expect(diScope.resolve('clientInfo')).toMatchObject(mockMember)
  })
})
