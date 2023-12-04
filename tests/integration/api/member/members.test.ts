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
import members from './dummy-members.json'

describe('/api/members', () => {
  let app: Express

  let loggedInMember
  let token: string

  const presidentMember = members.find((it) => it.roles?.includes('president'))
  const regularMember = members.find(
    (it) =>
      !it.roles?.includes('president') &&
      it.association === presidentMember!.association,
  )

  const companionMembers = () =>
    members
      .filter((it) => it.association === loggedInMember.association)
      .filter((it) => it.isRegistered || loggedInMember.roles?.includes('president'))

  const generateToken = async () => {
    if (!loggedInMember) return ''
    const { generateToken: gen } = await import('../../../../src/utils/jwt')
    return gen(loggedInMember as unknown as Member)
  }

  beforeEach(async () => {
    app = container.resolve('app').expressApp
    await memberModel.insertMany(members)
    loggedInMember = presidentMember
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

    const sendRequest = async () => {
      return request(app)
        .get('/api/members')
        .set(config.get('jwt.headerName'), await generateToken())
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
      loggedInMember = undefined

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

    it('should return all members', async () => {
      limit = 40

      const res = await sendRequest()

      const members = companionMembers()
      const itemsCount = Math.min(members.length, limit)

      expect(res.body.items.length).toBe(itemsCount)
      expect(res.body.items.map((it) => it.name)).toEqual(
        expect.arrayContaining(members.slice(0, itemsCount).map((it) => it.name)),
      )
    })

    it('should apply the given offset', async () => {
      offset = 1

      const res = await sendRequest()

      const members = companionMembers()

      expect(res.body.items[0]._id).toBe(members.map((it) => it._id)[offset])
    })

    it('should apply the given limit', async () => {
      limit = 1

      const res = await sendRequest()

      const members = companionMembers()

      expect(res.body.items.length).toBe(Math.min(members.length, limit))
    })

    it('should project appropriately in "lite" projection mode', async () => {
      projection = 'lite'

      const res = await sendRequest()

      const registeredMember = res.body.items.find((it) => it.isRegistered)

      expect(_.keys(registeredMember).sort()).toEqual([
        '_id',
        'email',
        'isRegistered',
        'name',
        'phoneNumber',
        'roles',
        'username',
      ])
    })

    it('should project appropriately in "full" projection mode', async () => {
      projection = 'full'

      const res = await sendRequest()

      const registeredMember = res.body.items.find((it) => it.isRegistered)

      expect(_.keys(registeredMember).sort()).toEqual([
        '_id',
        'address',
        'email',
        'guardNumber',
        'idNumber',
        'isRegistered',
        'name',
        'phoneNumber',
        'roles',
        'username',
      ])
    })

    it('should not project all properties to a regular member', async () => {
      projection = 'full'
      loggedInMember = regularMember

      const res = await sendRequest()

      const registeredMember = res.body.items.find((it) => it.isRegistered)

      expect(_.keys(registeredMember).sort()).not.toContain([
        'guardNumber',
        'address',
        'idNumber',
      ])
    })

    it('should not show unregistered members to a regular member', async () => {
      projection = 'full'
      loggedInMember = regularMember

      const res = await sendRequest()

      expect(res.body.items.find((it) => !it.isRegistered)).toBeFalsy()
    })

    it('should show unregistered members to a president member', async () => {
      projection = 'full'
      loggedInMember = presidentMember

      const res = await sendRequest()

      expect(res.body.items.find((it) => !it.isRegistered)).toBeDefined()
    })

    it('should order the members by name', async () => {
      const res = await sendRequest()

      const recievedNames = res.body.items.map((it) => it.name)

      expect(recievedNames).toEqual(recievedNames.sort())
    })

    it('should order the associations by name descendingly', async () => {
      orderBy = '-name'

      const res = await sendRequest()

      const recievedNames = res.body.items.map((it) => it.name)

      expect(recievedNames).toEqual(recievedNames.sort())
    })

    it('should order the members by username', async () => {
      projection = 'full'
      orderBy = 'username'

      const res = await sendRequest()

      const recievedUsernames = res.body.items.map((it) => it.username)

      expect(recievedUsernames).toEqual(recievedUsernames.sort())
    })

    it.each(['Farkas', 'Kriszti', 'Nagy'])(
      'should perform search query on members',
      async (searchQuery) => {
        q = searchQuery

        const res = await sendRequest()

        const recievedNames = res.body.items.map((it) => it.name)

        expect(recievedNames).toEqual(
          members
            .map((it) => it.name)
            .filter((it) => it)
            .filter((it) => new RegExp(searchQuery, 'i').test(it!))
            .sort(),
        )
      },
    )
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
