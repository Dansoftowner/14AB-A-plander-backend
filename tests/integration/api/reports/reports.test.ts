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
import { PDFExtract } from 'pdf.js-extract'
import { addHours, subDays } from 'date-fns'

describe('/api/assignments/:id/report', () => {
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

  let assignmentId: string | null | undefined

  const assigneesOfAssignment = () =>
    assignments
      .find((it) => it._id === assignmentId)
      ?.assignees?.map((it) => members.find((m) => m._id === it._id))

  const nonAssigneeMember = () =>
    membersOfAssociation().find((it) => !assigneesOfAssignment()!.includes(it))

  const authorOfAssignment = async (): Promise<string> => {
    const assignmentInDb = (await AssignmentModel.findById(assignmentId!).populate(
      'report',
    )) as unknown as any

    return assignmentInDb.report.member
  }

  describe('GET /:id', () => {
    let id: string

    const sendRequest = async () => {
      return request(app)
        .get(`/api/assignments/${id}/report`)
        .set(config.get('jwt.headerName'), await generateToken())
    }

    beforeEach(async () => {
      id = assignmentsOfAssociation()[0]._id
    })

    it('should return 401 if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 400 response if assignment id is invalid', async () => {
      id = '123'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 404 response if assignment does not exist', async () => {
      id = new mongoose.Types.ObjectId().toHexString()

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 404 response if assignment does not exist in the association', async () => {
      id = assignments.find((it) => it.association !== client.association)!._id

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 404 response if report does not exist', async () => {
      await AssignmentModel.findByIdAndUpdate(id, { report: null })

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return the report if the id is valid', async () => {
      const res = await sendRequest()

      const report = (await AssignmentModel.findById(id))?.report

      expect(res.body).toBeDefined()
      expect(res.body).toHaveProperty('_id', report?._id?.toHexString())
    })
  })

  describe('GET /pdf', () => {
    const sendRequest = async () => {
      return request(app)
        .get(`/api/assignments/${assignmentId}/report/pdf`)
        .set(config.get('jwt.headerName'), await generateToken())
        .responseType('blob')
    }

    beforeEach(async () => {
      assignmentId = assignmentsOfAssociation()[0]._id
    })

    it('should return 401 if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 400 response if assignment id is invalid', async () => {
      assignmentId = '123'

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 404 response if assignment does not exist', async () => {
      assignmentId = new mongoose.Types.ObjectId().toHexString()

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 404 response if assignment does not exist in the association', async () => {
      assignmentId = assignments.find(
        (it) => it.association !== client.association,
      )!._id

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 404 response if report does not exist', async () => {
      await AssignmentModel.findByIdAndUpdate(assignmentId, { report: null })

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should indicate pdf in Content-Type', async () => {
      const res = await sendRequest()

      expect(res.get('Content-Type')).toBe('application/pdf')
    })

    it('pdf should contain at least 1 page', async () => {
      const res = await sendRequest()

      const pdfStructure = await new PDFExtract().extractBuffer(res.body)

      expect(pdfStructure.pages.length).toBeGreaterThanOrEqual(1)
    })

    it('pdf should contain crucial information about the report', async () => {
      const res = await sendRequest()

      const pdfStructure = await new PDFExtract().extractBuffer(res.body)
      const pdfText = pdfStructure.pages
        .map((it) => it.content.map(({ str }) => str).join(' '))
        .join(' ')

      const assignment: any =
        await AssignmentModel.findById(assignmentId).populate('report')

      expect(pdfText.includes(assignment!.report!.purpose)).toBeTruthy()
      expect(pdfText.includes(assignment!.report!.description)).toBeTruthy()
      expect(
        assignment!.assignees.every(({ name }) => pdfText.includes(name)),
      ).toBeTruthy()
    })
  })

  describe('POST /', () => {
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
        .post(`/api/assignments/${assignmentId}/report`)
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

    beforeEach(async () => {
      assignmentId = assignmentsOfAssociation()[0]._id
      method = 'vehicle'
      purpose = 'Securing events'
      licensePlateNumber = 'ddf-123'
      startKm = 0
      endKm = 10
      externalOrganization = 'police'
      externalRepresentative = 'Mr. Policeman'
      description = 'Nothing special happened.'

      client = assigneesOfAssignment()![0]

      await AssignmentModel.findByIdAndUpdate(assignmentId, { report: null })
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

    it('should return 404 response if no assignment is found with the given id', async () => {
      assignmentId = new mongoose.Types.ObjectId().toHexString()

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 404 response if the assignment is not in the association of the client', async () => {
      assignmentId = assignments.find(
        (it) => it.association !== client.association,
      )!._id

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 409 response if the assignment already has a report', async () => {
      await AssignmentModel.findByIdAndUpdate(assignmentId, {
        report: new mongoose.Types.ObjectId(),
      })

      const res = await sendRequest()

      expect(res.status).toBe(409)
    })

    it('should return 422 response if assignment is not finished yet', async () => {
      await AssignmentModel.findByIdAndUpdate(assignmentId, {
        start: new Date(),
        end: addHours(new Date(), 1),
      })

      const res = await sendRequest()

      expect(res.status).toBe(422)
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

      const assignmentInDb = await AssignmentModel.findById(assignmentId)
      const savedReport = await ReportModel.findOne({ _id: assignmentInDb!.report })

      expect(savedReport).not.toBeNull()
      expect(savedReport!.member.toHexString()).toBe(client._id)
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

      const assignmentInDb = await AssignmentModel.findById(assignmentId)
      const savedReport = await ReportModel.findOne({ _id: assignmentInDb!.report })

      expect(res.body).toBeDefined()
      expect(res.body).toHaveProperty('_id', savedReport!._id.toHexString())
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

  describe('PATCH /', () => {
    let method: string | null | undefined
    let purpose: string | null | undefined
    let licensePlateNumber: string | null | undefined
    let startKm: number | null | undefined
    let endKm: number | null | undefined
    let externalOrganization: string | null | undefined
    let externalRepresentative: string | null | undefined
    let description: string | null | undefined

    const sendRequest = async () => {
      return request(app)
        .patch(`/api/assignments/${assignmentId}/report`)
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
        .find((it) => it._id === assignmentId)
        ?.assignees?.map((it) => members.find((m) => m._id === it._id))

    const nonAssigneeMember = () =>
      membersOfAssociation().find((it) => !assigneesOfAssignment()!.includes(it))

    beforeEach(async () => {
      assignmentId = assignmentsOfAssociation()[0]._id
      method = 'vehicle'
      purpose = 'Securing events'
      licensePlateNumber = 'ddf-123'
      startKm = 0
      endKm = 10
      externalOrganization = 'police'
      externalRepresentative = 'Mr. Policeman'
      description = 'Nothing special happened.'

      client = assigneesOfAssignment()![0]
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

    it('should return 403 response if client is not the author of the report', async () => {
      const author = await authorOfAssignment()

      client = assigneesOfAssignment()!.find((it) => it!._id !== author)!

      const res = await sendRequest()

      expect(res.status).toBe(403)
    })

    it('should return 404 response if no assignment is found with the given id', async () => {
      assignmentId = new mongoose.Types.ObjectId().toHexString()

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 404 response if the assignment is not in the association of the client', async () => {
      assignmentId = assignments.find(
        (it) => it.association !== client.association,
      )!._id

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 404 response if report is not associated with the assignment', async () => {
      await AssignmentModel.findByIdAndUpdate(assignmentId, { report: null })

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 422 response if the report is older than 3 days', async () => {
      const reportId = (await AssignmentModel.findById(assignmentId))!.report

      await ReportModel.findByIdAndUpdate(reportId, {
        submittedAt: subDays(new Date(), 3),
      })

      const res = await sendRequest()

      expect(res.status).toBe(422)
    })

    it('should return 400 response if the startKm is greater than the endKm', async () => {
      startKm = 12
      endKm = 10

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if external representative is defined but the external organization is not', async () => {
      externalOrganization = null

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

    it('should update report in database', async () => {
      await sendRequest()

      const assignmentInDb = await AssignmentModel.findById(assignmentId)
      const savedReport = await ReportModel.findOne({ _id: assignmentInDb!.report })

      expect(savedReport).not.toBeNull()
      expect(savedReport!.method).toBe(method)
      expect(savedReport!.purpose).toBe(purpose)
      expect(savedReport!.licensePlateNumber).toBe(licensePlateNumber)
      expect(savedReport!.startKm).toBe(startKm)
      expect(savedReport!.endKm).toBe(endKm)
      expect(savedReport!.externalOrganization).toBe(externalOrganization)
      expect(savedReport!.externalRepresentative).toBe(externalRepresentative)
      expect(savedReport!.description).toBe(description)
    })

    it('should return 200 response if report is successfully saved', async () => {
      const res = await sendRequest()

      expect(res.status).toBe(200)
    })

    it('should return the updated report', async () => {
      const res = await sendRequest()

      const assignmentInDb = await AssignmentModel.findById(assignmentId)
      const savedReport = await ReportModel.findOne({ _id: assignmentInDb!.report })

      expect(res.body).toBeDefined()
      expect(res.body).toHaveProperty('_id', savedReport!._id.toHexString())
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

  describe('DELETE /', () => {
    const sendRequest = async () => {
      return request(app)
        .delete(`/api/assignments/${assignmentId}/report`)
        .set(config.get('jwt.headerName'), await generateToken())
    }

    beforeEach(async () => {
      assignmentId = assignments[0]._id
    })

    it('should return 401 response if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 403 response if client is not the author of the report', async () => {
      const author = await authorOfAssignment()

      client = assigneesOfAssignment()!.find((it) => it!._id !== author)

      const res = await sendRequest()

      expect(res.status).toBe(403)
    })
  })
})
