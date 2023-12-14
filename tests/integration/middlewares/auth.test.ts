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

  const initializeApp = () => {
    app.use(i18n)
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
  let header: string | undefined

  const sendRequest = () => {
    const req = request(app).get('/test')
    if (header) req.set(config.get('jwt.headerName'), header)
    return req
  }

  const generateToken = (secret: string = config.get('jwt.privateKey')) => {
    return jwt.sign(mockMember, secret)
  }

  beforeEach(() => {
    routeHandler.mockClear()
    mockMember = { _id: '123' }
    header = generateToken()
  })

  it('should return 401 message if no token provided', async () => {
    header = undefined

    const res = await sendRequest()

    expect(res.status).toBe(401)
    expect(routeHandler).not.toHaveBeenCalled()
  })

  it('should return 400 message if invalid token provided', async () => {
    header = generateToken('invalid-secret')

    const res = await sendRequest()

    expect(res.status).toBe(400)
    expect(routeHandler).not.toHaveBeenCalled()
  })

  it('should return 200 message if valid token provided in header', async () => {
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
