import { Express } from 'express'
import request from 'supertest'
import _ from 'lodash'
import config from 'config'
import mongoose from 'mongoose'
import MemberModel, { Member } from '../../../../src/models/member'
import container from '../../../../src/di'
import { rateLimiterStore } from '../../../../src/middlewares/rate-limiter'
import assignments from './dummy-assignments.json'
import AssignmentModel from '../../../../src/models/assignment'

describe('/api/assignments', () => {
  let app: Express

  let client

  const generateToken = async () => {
    if (!client) return ''
    const { generateToken: gen } = await import('../../../../src/utils/jwt')
    return gen(client as unknown as Member)
  }

  beforeAll(async () => {
    app = container.resolve('app').expressApp
    await MemberModel.deleteMany({})
    await AssignmentModel.deleteMany({})
  })

  beforeEach(async () => {
    client = await new MemberModel({
      roles: ['president'],
      association: '652f7b95fc13ae3ce86c7ce6',
    }).save({ validateBeforeSave: false })

    await AssignmentModel.insertMany(assignments)

    rateLimiterStore.resetAll()
  })

  afterEach(async () => {
    await MemberModel.deleteMany({})
    await AssignmentModel.deleteMany({})
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe('GET /', () => {
    let start
    let end

    const sendRequest = async () => {
      return request(app)
        .get('/api/assignments')
        .query({ start, end })
        .set(config.get('jwt.headerName'), await generateToken())
    }

    it('should return 401 response if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should contain metadata', async () => {
      start = end = '2022-12-12'

      const res = await sendRequest()

      expect(res.body.metadata).toBeDefined()
      expect(res.body.metadata).toHaveProperty('start', start)
      expect(res.body.metadata).toHaveProperty('end', end)
    })
  })
})
