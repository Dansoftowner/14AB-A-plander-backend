import { Express } from 'express'
import request from 'supertest'
import associationModel from '../../../../src/api/association/association-model'
import container from '../../../../src/di'

describe('/api/associations', () => {
  let app: Express

  const associations = [
    { name: 'Assoc', certificate: '07/0001', location: 'mama hotel' },
    { name: 'Assoc2', certificate: '07/0002', location: 'mama hotel2' },
    { name: 'Assoc3', certificate: '07/0003', location: 'mama hotel3' },
  ]

  beforeEach(async () => {
    container.resolve('app')
    app = container.resolve('expressApp')
    await associationModel.insertMany(associations)
  })

  afterEach(async () => {
    await associationModel.deleteMany({})
  })

  describe('GET /', () => {
    let offset: number | undefined
    let limit: number | undefined
    let projection: string | undefined
    let orderBy: string | undefined
    let q: string | undefined

    const sendRequest = () => {
      return request(app).get('/api/associations').query({
        offset,
        limit,
        projection,
        orderBy,
        q,
      })
    }

    afterEach(async () => {
      offset = limit = projection = orderBy = q = undefined
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

    it('should apply the given offset', async () => {
      offset = 1

      const res = await sendRequest()

      expect(res.body.items[0]).toMatchObject(associations[offset])
    })
  })
})
