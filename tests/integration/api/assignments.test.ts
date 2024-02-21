import { Express } from 'express'
import request from 'supertest'
import _ from 'lodash'
import config from 'config'
import mongoose from 'mongoose'
import MemberModel, { Member } from '../../../src/models/member'
import container from '../../../src/di'
import { rateLimiterStore } from '../../../src/middlewares/rate-limiter'
import assignments from '../dummy-data/assignments.json'
import members from '../dummy-data/members.json'
import AssignmentModel, { Assignment } from '../../../src/models/assignment'
import ReportModel from '../../../src/models/report'
import { add, addDays, addHours, endOfMonth, startOfMonth, subDays } from 'date-fns'

describe('/api/assignments', () => {
  let app: Express

  let client

  const presidentMember = members.find((it) => it.roles?.includes('president'))
  const regularMember = members
    .filter((it) => it.association === presidentMember!.association)
    .find((it) => !it.roles?.includes('president'))

  const generateToken = async () => {
    if (!client) return ''
    const { generateToken: gen } = await import('../../../src/utils/jwt')
    return gen(client as unknown as Member)
  }

  const assignmentsOfAssociation = () =>
    assignments.filter((it) => it.association == client.association)

  const membersOfAssociation = () =>
    members.filter((it) => it.association == client.association)

  beforeAll(async () => {
    app = container.resolve('app').expressApp
    await MemberModel.deleteMany({})
    await AssignmentModel.deleteMany({})
  })

  beforeEach(async () => {
    client = presidentMember

    await MemberModel.insertMany(members)
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
        ['_id', 'title', 'start', 'end', 'report'].sort(),
      )
    })

    it('should show all fields in full projection mode', async () => {
      projection = 'full'

      const res = await sendRequest()

      expect(_.keys(res.body.items[0]).sort()).toEqual(
        ['_id', 'title', 'start', 'end', 'location', 'assignees', 'report'].sort(),
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

      expect(_.keys(res.body)).toEqual(['_id', 'title', 'start', 'end', 'report'])
    })

    it('should project all fields in full projection mode', async () => {
      projection = 'full'

      const res = await sendRequest()

      expect(_.keys(res.body).sort()).toEqual(
        ['_id', 'title', 'start', 'end', 'location', 'assignees', 'report'].sort(),
      )
    })
  })

  describe('POST /', () => {
    let title: string | undefined
    let start: string | undefined
    let end: string | undefined
    let location: string | undefined
    let assignees: string[] | undefined

    const sendRequest = async () => {
      return request(app)
        .post('/api/assignments')
        .send({ title, start, end, location, assignees })
        .set(config.get('jwt.headerName'), await generateToken())
    }

    beforeEach(() => {
      title = 'Test Assignment'
      start = addDays(new Date(), 2).toISOString()
      end = addHours(start, 1).toISOString()
      location = 'Test Location'
      assignees = membersOfAssociation()
        .map((it) => it._id)
        .slice(0, 2)
    })

    afterEach(() => {
      title = start = end = location = assignees = undefined
    })

    it('should return 401 response if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 403 response if client is not president', async () => {
      client = regularMember

      const res = await sendRequest()

      expect(res.status).toBe(403)
    })

    it('should return 400 response if the start is not provided', async () => {
      start = undefined

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if the end is not provided', async () => {
      end = undefined

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if the start is greater than the end', async () => {
      start = '2022-01-02T12:00:00.000Z'
      end = '2022-01-02T11:00:00.000Z'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if the assignees contains invalid id', async () => {
      assignees = ['123']

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if the assignees contains duplicate id', async () => {
      const assignee = membersOfAssociation()[0]
      assignees = new Array(2).fill(assignee._id)

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if the assignees contains id of a member not in the association', async () => {
      const assignee = members.find((it) => it.association !== client.association)
      assignees = [assignee!._id]

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if an unregistered assignee is referenced', async () => {
      const assignee = await new MemberModel({
        association: client.association,
        isRegistered: false,
      }).save({
        validateBeforeSave: false,
      })

      assignees = [assignee!._id.toHexString()]

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 422 response if the assignment is in the past', async () => {
      start = subDays(new Date(), 1).toISOString()
      end = addHours(start, 1).toISOString()

      const res = await sendRequest()

      expect(res.status).toBe(422)
    })

    it('should save assignment into database', async () => {
      await sendRequest()

      const assignment = await AssignmentModel.findOne({ title })

      expect(assignment).not.toBeNull()
      expect(assignment).toHaveProperty('title', title)
      expect(assignment).toHaveProperty('location', location)
      expect(assignment).toHaveProperty('start', new Date(start!))
      expect(assignment).toHaveProperty('end', new Date(end!))
      expect(assignment!.assignees).toHaveLength(assignees!.length)
      expect(assignment!.assignees.map((it) => it._id.toHexString())).toEqual(assignees)
    })

    it('should return the saved assignment', async () => {
      const res = await sendRequest()

      expect(res.body).toBeDefined()
      expect(res.body).toHaveProperty('title', title)
      expect(res.body).toHaveProperty('location', location)
      expect(res.body).toHaveProperty('start', start!)
      expect(res.body).toHaveProperty('end', end!)
      expect(res.body.assignees).toHaveLength(assignees!.length)
      expect(res.body.assignees.map((it) => it._id)).toEqual(assignees)
    })
  })

  describe('PATCH /:id', () => {
    let id: string
    let title: string | null | undefined
    let start: string | null | undefined
    let end: string | null | undefined
    let location: string | null | undefined
    let assignees: string[] | null | undefined

    const sendRequest = async () => {
      return request(app)
        .patch(`/api/assignments/${id}`)
        .send({ title, start, end, location, assignees })
        .set(config.get('jwt.headerName'), await generateToken())
    }

    beforeEach(async () => {
      const assignment = await new AssignmentModel({
        association: client.association,
        start: addDays(new Date(), 1),
        end: add(new Date(), { days: 1, hours: 1 }),
        assignees: [membersOfAssociation()[0]._id],
      }).save({ validateBeforeSave: false })

      id = assignment._id.toHexString()
      title = 'New Title'
      location = 'New Location'
      start = new Date().toISOString()
      end = add(start, { hours: 2 }).toISOString()
      assignees = [membersOfAssociation()[1]._id]
    })

    it('should return 401 response if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 403 response if client is not president', async () => {
      client = regularMember

      const res = await sendRequest()

      expect(res.status).toBe(403)
    })

    it('should return 404 response if the given assignment does not exist', async () => {
      id = new mongoose.Types.ObjectId().toHexString()

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 400 response if id is invalid', async () => {
      id = 'invalid'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if start is null', async () => {
      start = null

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if end is null', async () => {
      end = null

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if start is greater than the end', async () => {
      start = '2022-01-02T12:00:00.000Z'
      end = '2022-01-02T11:00:00.000Z'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if the assignees contains invalid id', async () => {
      assignees = ['123']

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if the assignees contains duplicate id', async () => {
      const assignee = membersOfAssociation()[0]
      assignees = new Array(2).fill(assignee._id)

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if the assignees contains id of a member not in the association', async () => {
      const assignee = members.find((it) => it.association !== client.association)
      assignees = [assignee!._id]

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if an unregistered assignee is referenced', async () => {
      const assignee = await new MemberModel({
        association: client.association,
        isRegistered: false,
      }).save({
        validateBeforeSave: false,
      })

      assignees = [assignee!._id.toHexString()]

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 422 response if start is greater than the end stored in database', async () => {
      end = undefined
      start = add((await AssignmentModel.findById(id))!.end, {
        hours: 1,
      }).toISOString()

      const res = await sendRequest()

      expect(res.status).toBe(422)
    })

    it('should return 423 response if assignment is older than 3 days', async () => {
      const assignment = await new AssignmentModel({
        association: client.association,
        end: subDays(new Date(), 3),
      }).save({ validateBeforeSave: false })

      id = assignment._id.toHexString()

      const res = await sendRequest()

      expect(res.status).toBe(423)
    })

    it('should update the assignment with the provided fields', async () => {
      const res = await sendRequest()

      const assignment = await AssignmentModel.findById(id)

      expect(assignment!.title).toBe(title)
      expect(assignment!.location).toBe(location)
      expect(assignment!.start!.toISOString()).toBe(start)
      expect(assignment!.end!.toISOString()).toBe(end)
    })

    it('should remove assignees', async () => {
      assignees = []

      await sendRequest()

      const assignment = await AssignmentModel.findById(id)

      expect(assignment!.assignees).toHaveLength(0)
    })

    it('should update assignees', async () => {
      const rawAssignees = membersOfAssociation().slice(1, 3)

      assignees = rawAssignees.map((it) => it._id)

      await sendRequest()

      const assignment = await AssignmentModel.findById(id)

      expect(assignment!.assignees).toHaveLength(assignees!.length)
      expect(assignment!.assignees.map((it) => it._id.toHexString()).sort()).toEqual(
        rawAssignees.map((it) => it._id).sort(),
      )
      expect(assignment!.assignees.map((it) => it.name).sort()).toEqual(
        rawAssignees.map((it) => it.name).sort(),
      )
    })

    it('should return the updated assignment', async () => {
      title = 'New Title'

      const res = await sendRequest()

      expect(res.body.title).toBe(title)
    })
  })

  describe('DELETE /:id', () => {
    let id: string

    const sendRequest = async () => {
      return request(app)
        .delete(`/api/assignments/${id}`)
        .set(config.get('jwt.headerName'), await generateToken())
    }

    beforeEach(async () => {
      const assignment = await new AssignmentModel({
        association: client.association,
        start: addDays(new Date(), 1),
        end: add(new Date(), { days: 1, hours: 1 }),
        assignees: [membersOfAssociation()[0]._id],
      }).save({ validateBeforeSave: false })

      id = assignment._id.toHexString()
    })

    it('should return 401 response if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 403 response if client is not president', async () => {
      client = regularMember

      const res = await sendRequest()

      expect(res.status).toBe(403)
    })

    it('should return 404 response if the given assignment does not exist', async () => {
      id = new mongoose.Types.ObjectId().toHexString()

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 400 response if id is invalid', async () => {
      id = 'invalid'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should delete the assignment', async () => {
      await sendRequest()

      const assignment = await AssignmentModel.findById(id)

      expect(assignment).toBeNull()
    })

    it('should delete the report associated with the assignment', async () => {
      let { _id: reportId } = await new ReportModel().save({
        validateBeforeSave: false,
      })
      await AssignmentModel.findByIdAndUpdate(id, { report: reportId })

      await sendRequest()

      const report = await ReportModel.findById(reportId)

      expect(report).toBeNull()
    })
  })
})
