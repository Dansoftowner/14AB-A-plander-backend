import { Express } from 'express'
import request from 'supertest'
import _ from 'lodash'
import associationModel from '../../../../src/api/association/association.model'
import container from '../../../../src/di'
import mongoose from 'mongoose'

describe('/api/associations', () => {
  let app: Express

  const associations = [
    { name: 'BlueTeam', certificate: '07/0002', location: 'Coymond' },
    { name: 'Alphas', certificate: '07/0001', location: 'Blow Place' },
    { name: 'Ceasers', certificate: '07/0003', location: 'mama hotel' },
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

      expect(res.body.items[0].name).toBe(
        associations.map((it) => it.name).sort()[offset],
      )
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

    it('should order the associations by name', async () => {
      const res = await sendRequest()

      expect(res.body.items.map((it) => it.name)).toEqual(
        associations.map((it) => it.name).sort(),
      )
    })

    it('should order the associations by name descendingly', async () => {
      orderBy = '-name'

      const res = await sendRequest()

      expect(res.body.items.map((it) => it.name)).toEqual(
        associations
          .map((it) => it.name)
          .sort()
          .reverse(),
      )
    })

    it('should order the associations by location', async () => {
      projection = 'full'
      orderBy = 'location'

      const res = await sendRequest()

      expect(res.body.items.map((it) => it.location)).toEqual(
        associations.map((it) => it.location).sort(),
      )
    })

    it.each([['blue'], ['pha'], ['as'], ['a']])(
      'should perform search query on associations',
      async (searchQuery) => {
        q = searchQuery

        const res = await sendRequest()

        expect(res.body.items.map((it) => it.name)).toEqual(
          associations
            .map((it) => it.name)
            .filter((it) => new RegExp(`.*${searchQuery}.*`, 'i').test(it))
            .sort(),
        )
      },
    )
  })

  describe('GET /:id', () => {
    let id: string
    let projection: string
    let association: object

    const sendRequest = () => {
      return request(app).get(`/api/associations/${id}`).query({
        projection,
      })
    }

    beforeEach(async () => {
      projection = 'full'
      association = associations[0]
      id = (await associationModel.findOne(association))!._id.toHexString()
    })

    it('should return 400 response if the id is not a valid ObjectId', async () => {
      id = '123'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 404 response if no association found with the given id', async () => {
      id = new mongoose.Types.ObjectId().toHexString()

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return the association if the id is valid', async () => {
      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject(association)
    })

    it('should project only the _id and name fields in "lite" projection mode', async () => {
      projection = 'lite'

      const res = await sendRequest()

      expect(_.keys(res.body).sort()).toEqual(['_id', 'name'])
    })

    it('should project all the fields in "full" projection mode', async () => {
      projection = 'full'

      const res = await sendRequest()

      expect(_.keys(res.body).sort()).toEqual(['_id', ..._.keys(association)].sort())
    })
  })
})
