import { Express } from 'express'
import request from 'supertest'
import _ from 'lodash'
import config from 'config'
import memberModel, { Member } from '../../../../src/models/member'
import container from '../../../../src/di'
import mongoose from 'mongoose'
import { rateLimiterStore } from '../../../../src/middlewares/rate-limiter'
import members from './dummy-members.json'
import registrationTokenModel from '../../../../src/models/registration-token'
import nodemailer from 'nodemailer'
import { NodemailerMock } from 'nodemailer-mock'

const { mock: nodemailerMock } = nodemailer as unknown as NodemailerMock

describe('/api/members', () => {
  let app: Express

  let client

  const presidentMember = members.find((it) => it.roles?.includes('president'))
  const regularMember = members.find(
    (it) =>
      !it.roles?.includes('president') &&
      it.association === presidentMember!.association,
  )

  const companionMembers = () =>
    members
      .filter((it) => it.association === client.association)
      .filter((it) => it.isRegistered || client.roles?.includes('president'))

  const generateToken = async () => {
    if (!client) return ''
    const { generateToken: gen } = await import('../../../../src/utils/jwt')
    return gen(client as unknown as Member)
  }

  beforeAll(async () => {
    app = container.resolve('app').expressApp
    await memberModel.deleteMany({})
  })

  beforeEach(async () => {
    await memberModel.insertMany(members)
    client = presidentMember
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
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should contain metadata', async () => {
      offset = limit = 1

      const res = await sendRequest()

      expect(res.body.metadata).toBeDefined()
      expect(res.body.metadata).toHaveProperty(
        'total',
        members.filter((it) => it.association === client.association).length,
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
      client = regularMember

      const res = await sendRequest()

      const registeredMember = res.body.items.find((it) => it.isRegistered)

      expect(_.keys(registeredMember)).not.toContain([
        'guardNumber',
        'address',
        'idNumber',
      ])
    })

    it('should not show unregistered members to a regular member', async () => {
      projection = 'full'
      client = regularMember

      const res = await sendRequest()

      expect(res.body.items.find((it) => !it.isRegistered)).toBeFalsy()
    })

    it('should show unregistered members to a president member', async () => {
      projection = 'full'
      client = presidentMember

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

    it.each(['Papp', 'or', 'a'])(
      'should perform search query on members',
      async (searchQuery) => {
        offset = 0
        limit = 5
        q = searchQuery

        const res = await sendRequest()

        const recievedNames = res.body.items.map((it) => it.name)
        const expected = members
          .filter((it) => it.association == client.association)
          .map((it) => it.name)
          .filter((it) => it)
          .filter((it) => new RegExp(searchQuery, 'i').test(it!))
          .sort()

        expect(res.body.metadata.total).toBe(expected.length)
        expect(recievedNames).toEqual(expected.slice(offset, offset + limit))
      },
    )
  })

  describe('GET /:id', () => {
    let id: string
    let projection: string
    let member

    const sendRequest = async () => {
      return request(app)
        .get(`/api/members/${id}`)
        .set(config.get('jwt.headerName'), await generateToken())
        .query({
          projection,
        })
    }

    beforeEach(async () => {
      projection = 'full'
      member = members.find(
        (it) => it !== client && it.association === client.association,
      )
      id = member._id
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

    it('should return 404 response if no member found with the given id', async () => {
      id = new mongoose.Types.ObjectId().toHexString()

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 404 response if no member found with the given id in the association', async () => {
      id = members.find((it) => it.association !== client.association)!._id

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return the member if the id is valid', async () => {
      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject(
        _.omit(member, ['association', 'password', 'preferences']),
      )
    })

    it('should project appropriately in "lite" projection mode', async () => {
      projection = 'lite'

      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(_.keys(res.body).sort()).toEqual([
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
      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(_.keys(res.body).sort()).toEqual([
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
      client = regularMember

      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(_.keys(res.body)).not.toContain(['guardNumber', 'address', 'idNumber'])
    })

    it('should not show unregistered member to a regular member', async () => {
      client = regularMember
      id = members
        .filter((it) => it.association == client.association)
        .find((it) => !it.isRegistered)!._id

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should show unregistered member to a president member', async () => {
      client = presidentMember

      const unregisteredMember = members
        .filter((it) => it.association == client.association)
        .find((it) => !it.isRegistered)
      id = unregisteredMember!._id

      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject(_.omit(unregisteredMember!, ['association']))
    })

    it('should show all properties if the client is the same as the requested one', async () => {
      client = regularMember
      id = client._id

      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(_.keys(res.body)).toContain('idNumber')
      expect(_.keys(res.body)).toContain('address')
      expect(_.keys(res.body)).toContain('guardNumber')
    })
  })

  describe('GET /me', () => {
    const sendRequest = async () => {
      return request(app)
        .get('/api/members/me')
        .set(config.get('jwt.headerName'), await generateToken())
        .query({ projection: 'full' })
    }

    beforeEach(async () => {})

    it('should return 401 message if no token provided', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return client information logged in', async () => {
      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject(
        _.omit(client, ['association', 'preferences', 'password']),
      )
    })
  })

  describe('GET /username/:username', () => {
    let username: string
    let projection: string
    let member

    const sendRequest = async () => {
      return request(app)
        .get(`/api/members/username/${username}`)
        .set(config.get('jwt.headerName'), await generateToken())
        .query({
          projection,
        })
    }

    beforeEach(async () => {
      projection = 'full'
      member = members.find(
        (it) => it !== client && it.association === client.association,
      )
      username = member.username
    })

    it('should return 401 response if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 404 response if no member found with the given username', async () => {
      username = Math.random().toString()

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 404 response if no member found with the given username in the association', async () => {
      username = members.find((it) => it.association !== client.association)!._id

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return the member if the username is valid', async () => {
      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject(
        _.omit(member, ['association', 'password', 'preferences']),
      )
    })

    it('should project appropriately in "lite" projection mode', async () => {
      projection = 'lite'

      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(_.keys(res.body).sort()).toEqual([
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
      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(_.keys(res.body).sort()).toEqual([
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
      client = regularMember

      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(_.keys(res.body)).not.toContain(['guardNumber', 'address', 'idNumber'])
    })

    it('should show all properties if the client is the same as the requested one', async () => {
      client = regularMember
      username = client.username

      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(_.keys(res.body)).toContain('idNumber')
      expect(_.keys(res.body)).toContain('address')
      expect(_.keys(res.body)).toContain('guardNumber')
    })
  })

  describe('POST /api/members/', () => {
    let payload: {
      email: string | undefined
      guardNUmber: string | undefined
      name: string | undefined
      address: string | undefined
      idNumber: string | undefined
      phoneNumber: string | undefined
    }

    const sendRequest = async () => {
      return request(app)
        .post('/api/members')
        .set(config.get('jwt.headerName'), await generateToken())
        .send(payload)
    }

    beforeEach(async () => {
      payload = {
        email: 'member@example.com',
        guardNUmber: undefined,
        name: undefined,
        address: undefined,
        idNumber: undefined,
        phoneNumber: undefined,
      }
      nodemailerMock.reset()
    })

    it('should return 401 response if no token provided', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 403 response if the client is not a president', async () => {
      client = regularMember

      const res = await sendRequest()

      expect(res.status).toBe(403)
    })

    it('should return 400 response if email is not specified', async () => {
      payload.email = undefined

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 400 response if email is not valid', async () => {
      payload.email = Math.random().toString()

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 422 response if the email is already used by someone', async () => {
      payload.email = companionMembers().find((it) => it._id != client._id)!.email

      const res = await sendRequest()

      expect(res.status).toBe(422)
    })

    it('should save invited member to the database', async () => {
      const res = await sendRequest()

      const invitedMember = await memberModel.findOne({
        association: client.association,
        email: payload.email,
      })

      expect(res.status).toBe(201)
      expect(invitedMember).not.toBeNull()
      expect(invitedMember!.isRegistered).toBe(false)
    })

    it('should save invited member to the database', async () => {
      const res = await sendRequest()

      const invitedMember = await memberModel.findOne({
        association: client.association,
        email: payload.email,
      })

      expect(res.status).toBe(201)
      expect(invitedMember).not.toBeNull()
      expect(invitedMember!.isRegistered).toBe(false)
    })

    it('should return the invited member', async () => {
      const res = await sendRequest()

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject(_.pickBy(payload, (it) => it !== undefined))
    })

    it('should generate a registration token for the invited member', async () => {
      const res = await sendRequest()

      const registrationToken = await registrationTokenModel.findOne({
        memberId: res.body._id,
      })

      expect(registrationToken).not.toBeNull()
      expect(registrationToken!.token).toMatch(/[a-f0-9]{40}/)
    })

    it('should send email for the invited member', async () => {
      await sendRequest()

      const sentEmails = nodemailerMock.getSentMail()

      expect(sentEmails).toHaveLength(1)
      expect(sentEmails[0].to).toBe(payload.email)
    })
  })
})
