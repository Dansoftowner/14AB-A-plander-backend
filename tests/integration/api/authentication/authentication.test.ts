import { Express } from 'express'
import request from 'supertest'
import _ from 'lodash'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import config from 'config'
import associationModel, { Association } from '../../../../src/models/association'
import memberModel, { Member } from '../../../../src/models/member'
import container from '../../../../src/di'
import mongoose from 'mongoose'
import { rateLimiterStore } from '../../../../src/middlewares/rate-limiter'
import { getAuthCookieInfo } from './utils'

describe('Endpoints related to authentication', () => {
  let app: Express

  const association = {
    _id: new mongoose.Types.ObjectId(),
    name: 'BlueTeam',
    certificate: '07/0002',
    location: 'Coymond',
  }

  const memberPassword = 'test'

  const member: Member = {
    _id: new mongoose.Types.ObjectId(),
    isRegistered: true,
    association: association._id,
    email: 'bverchambre0@alibaba.com',
    username: 'gizaac0',
    password: bcrypt.hashSync(memberPassword, bcrypt.genSaltSync(1)),
    name: 'Horváth Csaba',
    address: '929 Brentwood Hill',
    idNumber: '594771CQ',
    phoneNumber: '+256 (776) 361-0286',
    guardNumber: '08/0001/009226',
    roles: ['member', 'president'],
  }

  beforeEach(async () => {
    app = container.resolve('app').expressApp
    await associationModel.insertMany([association])
    await memberModel.insertMany([member])
    rateLimiterStore.resetAll()
  })

  afterEach(async () => {
    await associationModel.deleteMany({})
    await memberModel.deleteMany({})
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe('POST /api/auth', () => {
    let associationId: string | undefined
    let user: string | undefined
    let password: string | undefined
    let isAutoLogin: boolean | undefined

    const sendRequest = () => {
      return request(app).post('/api/auth').send({
        associationId,
        user,
        password,
        isAutoLogin,
      })
    }

    beforeEach(async () => {
      associationId = association._id.toHexString()
      user = member.username as string
      password = memberPassword
      isAutoLogin = undefined
    })

    it('should return 400 message if association not provided', async () => {
      associationId = undefined

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 message if associationId is not a valid ObjectId', async () => {
      associationId = '213214'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 message if user is not provided', async () => {
      user = undefined

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 message if password is not provided', async () => {
      password = undefined

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 401 message if the given username does not exist in the given organization', async () => {
      user = 'random_user'

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 401 message if the given email does not exist in the given organization', async () => {
      user = 'random_user@example.com'

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 401 message if the given password is not valid', async () => {
      password = memberPassword + '123'

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return token if the credentials are correct', async () => {
      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(() => jwt.verify(res.body, config.get('jwt.privateKey'))).not.toThrow()
    })

    it('should return token if the credentials are correct with the email', async () => {
      user = member.email

      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(() => jwt.verify(res.body, config.get('jwt.privateKey'))).not.toThrow()
    })

    it('should return cookie if the credentials are correct', async () => {
      const res = await sendRequest()

      const { cookie, isHttpOnly, isSameSiteLax, maxAge, token } =
        getAuthCookieInfo(res)

      expect(res.status).toBe(200)
      expect(cookie).toBeDefined()
      expect(isHttpOnly).toBe(true)
      expect(isSameSiteLax).toBe(true)
      expect(maxAge).toBeUndefined()
      expect(token).toBeDefined()
      expect(() => jwt.verify(token!, config.get('jwt.privateKey'))).not.toThrow()
    })

    it('should return permanent cookie if auto-login is turned on', async () => {
      isAutoLogin = true

      const res = await sendRequest()

      const { cookie, isHttpOnly, isSameSiteLax, maxAge, token } =
        getAuthCookieInfo(res)

      expect(res.status).toBe(200)
      expect(cookie).toBeDefined()
      expect(isHttpOnly).toBe(true)
      expect(isSameSiteLax).toBe(true)
      expect(maxAge).toBeGreaterThan(0)
      expect(token).toBeDefined()
      expect(() => jwt.verify(token!, config.get('jwt.privateKey'))).not.toThrow()
    })
  })

  describe('POST /api/logout', () => {
    const sendRequest = () => {
      return request(app).post('/api/logout').send()
    }

    it('should remove the token cookie by setting an expiry date in the past', async () => {
      const res = await sendRequest()

      const { expires } = getAuthCookieInfo(res)

      expect(expires).not.toContain(new Date().getFullYear().toString())
    })
  })
})
