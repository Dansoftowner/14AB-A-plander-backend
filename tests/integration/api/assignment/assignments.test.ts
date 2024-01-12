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
import { endOfMonth, startOfMonth } from 'date-fns'

describe('/api/assignments', () => {
  let app: Express

  let client

  const generateToken = async () => {
    if (!client) return ''
    const { generateToken: gen } = await import('../../../../src/utils/jwt')
    return gen(client as unknown as Member)
  }

  const assignmentsOfAssociation = () =>
    assignments.filter((it) => it.association == client.association)

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
    let start: string | undefined
    let end: string | undefined
    let projection: string | undefined
    let orderBy: string | undefined

    const sendRequest = async () => {
      return request(app)
        .get('/api/assignments')
        .query({ start, end, projection, orderBy })
        .set(config.get('jwt.headerName'), await generateToken())
    }

    beforeEach(() => {
      start = '2022-01-01'
      end = '2022-12-31'
    })

    afterEach(() => {
      start = end = projection = orderBy = undefined
    })

    it('should return 401 response if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should contain metadata', async () => {
      const res = await sendRequest()

      expect(res.body.metadata).toBeDefined()
      expect(res.body.metadata).toHaveProperty('start')
      expect(res.body.metadata).toHaveProperty('end')
    })

    it.each([
      ['2022-01-01', '2022-12-31'],
      ['2022-12-01', '2022-12-31'],
      ['2023-04-01', '2023-04-30'],
      ['2023-05-01', '2023-05-31'],
    ])(
      'should return assignments between the given boundaries',
      async (startDatetime, endDatetime) => {
        start = startDatetime
        end = endDatetime

        const expectedItems = assignmentsOfAssociation().filter(
          (it) =>
            new Date(it.start) >= new Date(start!) &&
            new Date(it.end) <= new Date(end!),
        )

        const res = await sendRequest()

        expect(res.body.items).toHaveLength(expectedItems.length)
      },
    )

    it('should return assignments from the current month if no boundaries provided', async () => {
      start = end = undefined

      const res = await sendRequest()

      expect(res.body.metadata.start).toBe(startOfMonth(new Date()).toISOString())
      expect(res.body.metadata.end).toBe(endOfMonth(new Date()).toISOString())
    })

    it('should show only particular fields in lite projection mode', async () => {
      projection = 'lite'

      const res = await sendRequest()

      expect(_.keys(res.body.items[0]).sort()).toEqual(
        ['_id', 'title', 'start', 'end'].sort(),
      )
    })

    it('should show all fields in full projection mode', async () => {
      projection = 'full'

      const res = await sendRequest()

      expect(_.keys(res.body.items[0]).sort()).toEqual(
        ['_id', 'title', 'start', 'end', 'location', 'assignees'].sort(),
      )
    })

    it.each(['title', 'start', 'end', 'location'])(
      'it should order the elements based on the given criteria',
      async (field) => {
        orderBy = field

        const res = await sendRequest()

        const recievedValues = res.body.items.map((it) => it[field])

        expect(recievedValues).toEqual(recievedValues.sort())
      },
    )
  })

  describe('GET /:id', () => {
    let id: string
    let projection: string | undefined

    const sendRequest = async () => {
      return request(app)
        .get(`/api/assignments/${id}`)
        .query({ projection })
        .set(config.get('jwt.headerName'), await generateToken())
    }

    beforeEach(() => {
      id = assignmentsOfAssociation()[0]._id
    })

    afterEach(() => {
      projection = undefined
    })

    it('should return 401 response if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 400 response if the id is not a valid ObjectId', async () => {
      id = '123'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 404 response if no assignment found with the given id', async () => {
      id = new mongoose.Types.ObjectId().toHexString()

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 404 response if no assignment found with the given id in the association', async () => {
      id = assignments.find((it) => it.association !== client.association)!._id

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return the assignment if the id is valid', async () => {
      const res = await sendRequest()

      expect(res.body).toBeDefined()
      expect(res.body).toHaveProperty('_id', id)
    })

    it('should project only certain fields in lite projection mode', async () => {
      projection = 'lite'

      const res = await sendRequest()

      expect(_.keys(res.body)).toEqual(['_id', 'title', 'start', 'end'])
    })

    it('should project all fields in full projection mode', async () => {
      projection = 'full'

      const res = await sendRequest()

      expect(_.keys(res.body).sort()).toEqual(
        ['_id', 'title', 'start', 'end', 'location', 'assignees'].sort(),
      )
    })
  })
})
