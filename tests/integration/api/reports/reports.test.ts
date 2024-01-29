import { Express } from 'express'
import request from 'supertest'
import _ from 'lodash'
import config from 'config'
import mongoose from 'mongoose'
import MemberModel, { Member } from '../../../../src/models/member'
import container from '../../../../src/di'
import { rateLimiterStore } from '../../../../src/middlewares/rate-limiter'
import assignments from '../../dummy-data/assignments.json'
import members from '../../dummy-data/members.json'
import reports from '../../dummy-data/reports.json'
import AssignmentModel, { Assignment } from '../../../../src/models/assignment'
import ReportModel from '../../../../src/models/report'
import { add, endOfMonth, startOfMonth } from 'date-fns'

describe('/api/assignments/{id}/report', () => {
  let app: Express

  let client

  const presidentMember = members.find((it) => it.roles?.includes('president'))
  const regularMember = members
    .filter((it) => it.association === presidentMember!.association)
    .find((it) => !it.roles?.includes('president'))

  const generateToken = async () => {
    if (!client) return ''
    const { generateToken: gen } = await import('../../../../src/utils/jwt')
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
    await ReportModel.deleteMany({})
  })

  beforeEach(async () => {
    client = presidentMember

    await MemberModel.insertMany(members)
    await AssignmentModel.insertMany(assignments)
    await ReportModel.insertMany(reports)

    rateLimiterStore.resetAll()
  })

  afterEach(async () => {
    await MemberModel.deleteMany({})
    await AssignmentModel.deleteMany({})
    await ReportModel.deleteMany({})
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe('GET /', () => {})

  describe('GET /:id', () => {})

  describe('POST /', () => {
    let assignment: string | undefined
    let method: string | undefined
    let purpose: string | undefined
    let licensePlateNumber: string | undefined
    let startKm: number | undefined
    let endKm: number | undefined
    let externalOrganization: string | undefined
    let externalRepresentative: string | undefined
    let description: string | undefined

    const sendRequest = async () => {
      return request(app)
        .post(`/api/assignments/${assignment}/report`)
        .send({
          method,
          purpose,
          licensePlateNumber,
          startKm,
          endKm,
          externalOrganization,
          externalRepresentative,
          description,
        })
        .set(config.get('jwt.headerName'), await generateToken())
    }

    const assigneesOfAssignment = () =>
      assignments
        .find((it) => it._id === assignment)
        ?.assignees?.map((it) => members.find((m) => m._id === it._id))

    const nonAssigneeMember = () =>
      membersOfAssociation().find((it) => !assigneesOfAssignment()!.includes(it))

    beforeEach(async () => {
      assignment = assignmentsOfAssociation()[0]._id
      method = 'vehicle'
      purpose = 'Securing events'
      licensePlateNumber = 'ddf-123'
      startKm = 0
      endKm = 10
      externalOrganization = 'police'
      externalRepresentative = 'Mr. Policeman'
      description = 'Nothing special happened.'

      client = assigneesOfAssignment()![0]

      await ReportModel.deleteOne({ assignment })
    })

    it('should return 401 response if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 403 response if client is not an assignee of the assignment', async () => {
      client = nonAssigneeMember()

      const res = await sendRequest()

      expect(res.status).toBe(403)
    })

    it('should return 400 response if the assignment is not specified', async () => {
      assignment = undefined

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 422 response if no assignment is found with the given id', async () => {
      assignment = new mongoose.Types.ObjectId().toHexString()

      const res = await sendRequest()

      expect(res.status).toBe(422)
    })

    it('should return 422 response if the assignment is not in the association of the client', async () => {
      assignment = assignments.find((it) => it.association !== client.association)!._id

      const res = await sendRequest()

      expect(res.status).toBe(422)
    })

    it('should return 409 response if the assignment already has a report', async () => {
      new ReportModel({ assignment }).save({ validateBeforeSave: false })

      const res = await sendRequest()

      expect(res.status).toBe(409)
    })

    it('should return 400 response if method is not provided', async () => {
      method = undefined

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if the purpose is not provided', async () => {
      purpose = undefined

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if the startKm is greater than the endKm', async () => {
      startKm = 12
      endKm = 10

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if external representative is defined but the external organization is not', async () => {
      externalOrganization = undefined

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if description is less than 5 characters', async () => {
      description = 'abc'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if description is greater than 1240 characters', async () => {
      description = 'a'.repeat(1241)

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 if method is less than 5 characters', async () => {
      method = 'abcd'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 if method is more than 255 characters', async () => {
      method = 'a'.repeat(256)

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 if purpose is less than 5 characters', async () => {
      purpose = 'abcd'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 if purpose is more than 255 characters', async () => {
      purpose = 'a'.repeat(256)

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 if externalOrganization is less than 5 characters', async () => {
      externalOrganization = 'abcd'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 if externalOrganization is more than 255 characters', async () => {
      externalOrganization = 'a'.repeat(256)

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 if externalRepresentative is less than 5 characters', async () => {
      externalRepresentative = 'abcd'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 if externalRepresentative is more than 255 characters', async () => {
      externalRepresentative = 'a'.repeat(256)

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should save report into database', async () => {
      await sendRequest()

      const savedReport = await ReportModel.findOne({ assignment })

      expect(savedReport).not.toBeNull()
      expect(savedReport!.member.toHexString()).toBe(client._id)
      expect(savedReport!.assignment.toHexString()).toBe(assignment)
      expect(savedReport!.method).toBe(method)
      expect(savedReport!.purpose).toBe(purpose)
      expect(savedReport!.licensePlateNumber).toBe(licensePlateNumber)
      expect(savedReport!.startKm).toBe(startKm)
      expect(savedReport!.endKm).toBe(endKm)
      expect(savedReport!.externalOrganization).toBe(externalOrganization)
      expect(savedReport!.externalRepresentative).toBe(externalRepresentative)
      expect(savedReport!.description).toBe(description)
    })

    it('should return 201 response if report is successfully saved', async () => {
      const res = await sendRequest()

      expect(res.status).toBe(201)
    })

    it('should return the saved report', async () => {
      const res = await sendRequest()

      const savedReport = await ReportModel.findOne({ assignment })

      expect(res.body).toBeDefined()
      expect(res.body).toHaveProperty('_id', savedReport!._id.toHexString())
      expect(res.body).toHaveProperty('assignment', assignment)
      expect(res.body).toHaveProperty('member', client._id)
      expect(res.body).toHaveProperty('method', method)
      expect(res.body).toHaveProperty('purpose', purpose)
      expect(res.body).toHaveProperty('licensePlateNumber', licensePlateNumber)
      expect(res.body).toHaveProperty('startKm', startKm)
      expect(res.body).toHaveProperty('endKm', endKm)
      expect(res.body).toHaveProperty('externalOrganization', externalOrganization)
      expect(res.body).toHaveProperty('externalRepresentative', externalRepresentative)
      expect(res.body).toHaveProperty('description', description)
    })
  })

  describe('PATCH /:id', () => {})
})
