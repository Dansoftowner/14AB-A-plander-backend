import { Express } from 'express'
import request from 'supertest'
import _ from 'lodash'
import associationModel, { Association } from '../../../../src/models/association'
import memberModel, { Member } from '../../../../src/models/member'
import container from '../../../../src/di'
import mongoose from 'mongoose'
import { rateLimiterStore } from '../../../../src/middlewares/rate-limiter'
import bcrypt from 'bcrypt'

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

  describe('POST /api/auth', () => {
    let associationId: string
    let user: string
    let password: string
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
      associationId = ''

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 message if user is not provided', async () => {
      user = ''

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 message if password is not provided', async () => {
      password = ''

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
  })
})
