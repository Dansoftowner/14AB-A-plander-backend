import { Express } from 'express'
import request from 'supertest'
import _ from 'lodash'
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
    app = container.resolve('app').expressApp
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
      expect(res.body.metadata).toHaveProperty('offset', offset)
      expect(res.body.metadata).toHaveProperty('limit', limit)
    })

    it('should return all associations', async () => {
      limit = 40

      const res = await sendRequest()

      const itemsCount = Math.min(associations.length, limit)

      expect(res.body.items.length).toBe(itemsCount)
      expect(res.body.items.map((it) => it.name)).toEqual(
        expect.arrayContaining(associations.slice(0, itemsCount).map((it) => it.name)),
      )
    })

    it('should apply the given offset', async () => {
      offset = 1

      const res = await sendRequest()

      expect(res.body.items[0].name).toBe(associations[offset].name)
    })

    it('should apply the given limit', async () => {
      limit = 1

      const res = await sendRequest()

      expect(res.body.items.length).toBe(Math.min(associations.length, limit))
    })

    it('should project only the _id and name fields in "lite" projection mode', async () => {
      projection = 'lite'

      const res = await sendRequest()

      expect(_.keys(res.body.items[0]).sort()).toEqual(['_id', 'name'])
    })

    it('should project all the fields in "full" projection mode', async () => {
      projection = 'full'

      const res = await sendRequest()

      expect(_.keys(res.body.items[0]).sort()).toEqual(
        ['_id', ..._.keys(associations[0])].sort(),
      )
    })
  })
})
