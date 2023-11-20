import { Express } from 'express'
import request from 'supertest'
import associationModel from '../../../../src/api/association/association-model'
import container from '../../../../src/di'

describe('/api/associations', () => {
  let app: Express

  beforeEach(() => {
    container.resolve('app')
    app = container.resolve('expressApp')
  })

  afterEach(async () => {
    await associationModel.deleteMany({})
  })

  describe('GET /api/associations', () => {
    describe('/', () => {
      const associations = [
        { name: 'Assoc', certificate: '07/0001', location: 'mama hotel' },
        { name: 'Assoc2', certificate: '07/0002', location: 'mama hotel2' },
        { name: 'Assoc3', certificate: '07/0003', location: 'mama hotel3' },
      ]

      let offset: number
      let limit: number
      let projection: string
      let orderBy: string
      let q: string

      const sendRequest = () => {
        return request(app).get('/api/associations').query({
          offset,
          limit,
          projection,
          orderBy,
          q,
        })
      }

      beforeEach(async () => {
        associationModel.insertMany(associations)
      })

      it('should contain metadata', async () => {
        offset = limit = 1

        const res = await sendRequest()

        expect(res.body.metadata).toBeDefined()
        expect(res.body.metadata).toHaveProperty('total', associations.length)
        expect(res.body.metadata).toHaveProperty('offset', 1)
        expect(res.body.metadata).toHaveProperty('limit', 1)
      })

      it('should return all associations', async () => {
        const res = await sendRequest()

        expect(res.body.items.length).toBe(associations.length)
        expect(res.body.items.map((it) => it.name)).toEqual(
          expect.arrayContaining(associations.map((it) => it.name)),
        )
      })
    })
  })
})
