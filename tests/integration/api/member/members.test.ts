import { Express } from 'express'
import request from 'supertest'
import _ from 'lodash'
import config from 'config'
import jwt from 'jsonwebtoken'
import associationModel, { Association } from '../../../../src/models/association'
import memberModel, { Member } from '../../../../src/models/member'
import container from '../../../../src/di'
import mongoose from 'mongoose'
import { rateLimiterStore } from '../../../../src/middlewares/rate-limiter'
import { generateToken } from '../../../../src/utils/jwt'
import members from './dummy-members.json'

describe('/api/members', () => {
  let app: Express

  const loggedInMember = members[0]
  let token: string

  beforeEach(async () => {
    app = container.resolve('app').expressApp
    await memberModel.insertMany(members)
    token = generateToken(loggedInMember as unknown as Member)
    rateLimiterStore.resetAll()
  })

  afterEach(async () => {
    await memberModel.deleteMany({})
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe('GET /', () => {
    let offset: number | undefined
    let limit: number | undefined
    let projection: string | undefined
    let orderBy: string | undefined
    let q: string | undefined

    const sendRequest = () => {
      return request(app)
        .get('/api/members')
        .set(config.get('jwt.headerName'), token)
        .query({
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

    it('should return 401 response if no token provided', async () => {
      token = ''

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should contain metadata', async () => {
      offset = limit = 1

      const res = await sendRequest()

      expect(res.body.metadata).toBeDefined()
      expect(res.body.metadata).toHaveProperty(
        'total',
        members.filter((it) => it.association === loggedInMember.association).length,
      )
      expect(res.body.metadata).toHaveProperty('offset', offset)
      expect(res.body.metadata).toHaveProperty('limit', limit)
    })

    // it('should return all associations', async () => {
    //   limit = 40

    //   const res = await sendRequest()

    //   const itemsCount = Math.min(associations.length, limit)

    //   expect(res.body.items.length).toBe(itemsCount)
    //   expect(res.body.items.map((it) => it.name)).toEqual(
    //     expect.arrayContaining(associations.slice(0, itemsCount).map((it) => it.name)),
    //   )
    // })

    // it('should apply the given offset', async () => {
    //   offset = 1

    //   const res = await sendRequest()

    //   expect(res.body.items[0].name).toBe(
    //     associations.map((it) => it.name).sort()[offset],
    //   )
    // })

    // it('should apply the given limit', async () => {
    //   limit = 1

    //   const res = await sendRequest()

    //   expect(res.body.items.length).toBe(Math.min(associations.length, limit))
    // })

    // it('should project only the _id and name fields in "lite" projection mode', async () => {
    //   projection = 'lite'

    //   const res = await sendRequest()

    //   expect(_.keys(res.body.items[0]).sort()).toEqual(['_id', 'name'])
    // })

    // it('should project all the fields in "full" projection mode', async () => {
    //   projection = 'full'

    //   const res = await sendRequest()

    //   expect(_.keys(res.body.items[0]).sort()).toEqual(
    //     ['_id', ..._.keys(associations[0])].sort(),
    //   )
    // })

    // it('should order the associations by name', async () => {
    //   const res = await sendRequest()

    //   expect(res.body.items.map((it) => it.name)).toEqual(
    //     associations.map((it) => it.name).sort(),
    //   )
    // })

    // it('should order the associations by name descendingly', async () => {
    //   orderBy = '-name'

    //   const res = await sendRequest()

    //   expect(res.body.items.map((it) => it.name)).toEqual(
    //     associations
    //       .map((it) => it.name)
    //       .sort()
    //       .reverse(),
    //   )
    // })

    // it('should order the associations by location', async () => {
    //   projection = 'full'
    //   orderBy = 'location'

    //   const res = await sendRequest()

    //   expect(res.body.items.map((it) => it.location)).toEqual(
    //     associations.map((it) => it.location).sort(),
    //   )
    // })

    // it.each([['blue'], ['pha'], ['as'], ['a']])(
    //   'should perform search query on associations',
    //   async (searchQuery) => {
    //     q = searchQuery

    //     const res = await sendRequest()

    //     expect(res.body.items.map((it) => it.name)).toEqual(
    //       associations
    //         .map((it) => it.name)
    //         .filter((it) => new RegExp(`.*${searchQuery}.*`, 'i').test(it))
    //         .sort(),
    //     )
    //   },
    // )
  })

  //   describe('GET /:id', () => {
  //     let id: string
  //     let projection: string
  //     let association: object

  //     const sendRequest = () => {
  //       return request(app).get(`/api/associations/${id}`).query({
  //         projection,
  //       })
  //     }

  //     beforeEach(async () => {
  //       projection = 'full'
  //       association = associations[0]
  //       id = (await associationModel.findOne(association))!._id.toHexString()
  //     })

  //     it('should return 400 response if the id is not a valid ObjectId', async () => {
  //       id = '123'

  //       const res = await sendRequest()

  //       expect(res.status).toBe(400)
  //     })

  //     it('should return 404 response if no association found with the given id', async () => {
  //       id = new mongoose.Types.ObjectId().toHexString()

  //       const res = await sendRequest()

  //       expect(res.status).toBe(404)
  //     })

  //     it('should return the association if the id is valid', async () => {
  //       const res = await sendRequest()

  //       expect(res.status).toBe(200)
  //       expect(res.body).toMatchObject(association)
  //     })

  //     it('should project only the _id and name fields in "lite" projection mode', async () => {
  //       projection = 'lite'

  //       const res = await sendRequest()

  //       expect(_.keys(res.body).sort()).toEqual(['_id', 'name'])
  //     })

  //     it('should project all the fields in "full" projection mode', async () => {
  //       projection = 'full'

  //       const res = await sendRequest()

  //       expect(_.keys(res.body).sort()).toEqual(['_id', ..._.keys(association)].sort())
  //     })
  //   })

  //   describe('GET /mine', () => {
  //     let association: object
  //     let token: string | undefined

  //     const sendRequest = () => {
  //       const req = request(app)
  //         .get('/api/associations/mine')
  //         .query({ projection: 'full' })

  //       if (token) req.set(config.get('jwt.headerName'), token)
  //       return req
  //     }

  //     beforeEach(async () => {
  //       association = associations[0]

  //       const associationId = (await associationModel.findOne(
  //         association,
  //       ))!._id.toHexString()

  //       token = jwt.sign({ association: associationId }, config.get('jwt.privateKey'))
  //     })

  //     it('should return 401 message if no token provided', async () => {
  //       token = undefined

  //       const res = await sendRequest()

  //       expect(res.status).toBe(401)
  //     })

  //     it('should return association if member is logged in', async () => {
  //       const res = await sendRequest()

  //       expect(res.status).toBe(200)
  //       expect(res.body).toMatchObject(association)
  //     })
  //   })
})
