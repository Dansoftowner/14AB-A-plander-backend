import { Express } from 'express'
import request from 'supertest'
import _ from 'lodash'
import container from '../../../../src/di'
import { rateLimiterStore } from '../../../../src/middlewares/rate-limiter'
import mongoose from 'mongoose'

describe('rate limiting: /api/associations', () => {
  let app: Express

  beforeEach(async () => {
    app = container.resolve('app').expressApp
    rateLimiterStore.resetAll()
  })

  const sendRequest = (url) => {
    return request(app).get(url)
  }

  afterAll(async () => {
    await mongoose.connection.close()
  })

  it.each(['/api/associations', '/api/associations/123'])(
    'should return 429 message if too many requests are fired',
    async (url) => {
      let res
      for (let i = 0; i < 100; i++) {
        res = await sendRequest(url)
        expect(res.status).not.toBe(429)
      }
      res = await sendRequest(url)
      expect(res.status).toBe(429)
    },
  )
})
