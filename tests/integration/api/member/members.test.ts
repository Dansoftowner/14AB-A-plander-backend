import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { Express } from 'express'
import request from 'supertest'
import _ from 'lodash'
import config from 'config'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import { NodemailerMock } from 'nodemailer-mock'
import MemberModel, { Member } from '../../../../src/models/member'
import container from '../../../../src/di'
import { rateLimiterStore } from '../../../../src/middlewares/rate-limiter'
import RegistrationTokenModel from '../../../../src/models/registration-token'
import RestorationTokenModel from '../../../../src/models/restoration-token'
import members from './dummy-members.json'

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
    await MemberModel.deleteMany({})
    await RegistrationTokenModel.deleteMany({})
  })

  beforeEach(async () => {
    await MemberModel.insertMany(members)
    client = presidentMember
    rateLimiterStore.resetAll()
  })

  afterEach(async () => {
    await MemberModel.deleteMany({})
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

  describe('POST /', () => {
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

      const invitedMember = await MemberModel.findOne({
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

      const registrationToken = await RegistrationTokenModel.findOne({
        memberId: res.body._id,
      })

      expect(registrationToken).not.toBeNull()
      expect(registrationToken!.token).toMatch(/[a-f0-9]{40}/)
    })

    it('should send email for the invited member', async () => {
      const res = await sendRequest()

      const memberId = res.body._id

      const registrationToken = await RegistrationTokenModel.findOne({
        memberId,
      })

      const sentEmails = nodemailerMock.getSentMail()

      expect(sentEmails).toHaveLength(1)
      expect(sentEmails[0].from).toBe(config.get('smtp.from'))
      expect(sentEmails[0].to).toBe(payload.email)
      expect(sentEmails[0]['context']).toHaveProperty('registrationLink')
      expect(sentEmails[0]['context'].registrationLink).toContain(memberId)
      expect(sentEmails[0]['context'].registrationLink).toContain(
        registrationToken!.token,
      )
    })
  })

  describe('/register/{id}/registrationToken', () => {
    afterEach(async () => {
      await RegistrationTokenModel.deleteMany({})
    })

    let member
    let id: string
    let token: string

    beforeEach(async () => {
      client = undefined

      member = members.find((it) => !it.isRegistered)
      id = member!._id
      token = crypto.randomBytes(20).toString('hex')

      await new RegistrationTokenModel({
        memberId: id,
        token,
      }).save()
    })

    describe('GET /', () => {
      beforeEach(async () => {
        member = {
          ...member,
          username: 'imthebest7',
          password: 'IhaveTheßestPass01',
          name: 'John Smith',
          address: 'London Avenue 12',
          idNumber: '2325IE',
          phoneNumber: '+12 23 43 111',
          guardNumber: undefined,
        }

        await MemberModel.findByIdAndUpdate(id, member)
      })

      const sendRequest = () => request(app).get(`/api/members/register/${id}/${token}`)

      it('should return 404 response if the given id is not a valid object id', async () => {
        id = '123'

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should return 404 response if the given id does not exist', async () => {
        id = new mongoose.Types.ObjectId().toHexString()

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should return 404 response if the registration token does not exist', async () => {
        token = crypto.randomBytes(20).toString('hex')

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should return invited member data if the url is valid', async () => {
        const res = await sendRequest()

        expect(res.body).toMatchObject(_.pick(member, _.keys(res.body)))
      })
    })

    describe('POST /', () => {
      let payload: {
        username: string | undefined
        password: string | undefined
        name: string | undefined
        address: string | undefined
        idNumber: string | undefined
        phoneNumber: string | undefined
        guardNumber: string | undefined
      }

      beforeEach(async () => {
        payload = {
          username: 'imthebest7',
          password: 'IhaveTheßestPass01',
          name: 'John Smith',
          address: 'London Avenue 12',
          idNumber: '2325IE',
          phoneNumber: '+12 23 43 111',
          guardNumber: undefined,
        }
      })

      const sendRequest = async () => {
        return request(app).post(`/api/members/register/${id}/${token}`).send(payload)
      }

      it.each(['username', 'password', 'name', 'address', 'idNumber', 'phoneNumber'])(
        'should return 400 response if %p is not specified',
        async (attribute) => {
          payload[attribute] = undefined

          const res = await sendRequest()

          expect(res.status).toBe(400)
        },
      )

      it.each(['aBc12', 'abcdefgh', 'Abcdefgh', '123456789'])(
        'should return 400 response if password is weak',
        async (pass) => {
          payload.password = pass

          const res = await sendRequest()

          expect(res.status).toBe(400)
        },
      )

      it('should return 404 response if the given id is not a valid object id', async () => {
        id = '123'

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should return 404 response if the given id does not exist', async () => {
        id = new mongoose.Types.ObjectId().toHexString()

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should return 404 response if the registration token does not exist', async () => {
        token = crypto.randomBytes(20).toString('hex')

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should return 422 response if the username is already in use', async () => {
        payload.username = members
          .filter((it) => it.association == member.association)
          .find((it) => it.isRegistered)!.username

        const res = await sendRequest()

        expect(res.status).toBe(422)
      })

      it('should return 422 response if the idNumber is already in use', async () => {
        payload.idNumber = members
          .filter((it) => it.association == member.association)
          .find((it) => it.isRegistered)!.idNumber

        const res = await sendRequest()

        expect(res.status).toBe(422)
      })

      it('should update member data in database', async () => {
        await sendRequest()

        const memberInDb = await MemberModel.findById(id)

        expect(memberInDb!.isRegistered).toBe(true)
        expect(_.omit(memberInDb, ['_id', 'password'])).toMatchObject(
          _.omit(payload, 'password'),
        )
      })

      it('should store hashed password in database', async () => {
        await sendRequest()

        const memberInDb = await MemberModel.findById(id)

        expect(memberInDb).not.toBeNull()
        expect(memberInDb!.password).not.toBe(payload.password)
        expect(bcrypt.compareSync(payload.password!, memberInDb!.password!)).toBe(true)
      })

      it('should remove registration token from database', async () => {
        await sendRequest()

        const registrationToken = await RegistrationTokenModel.findOne({
          memberId: id,
          token,
        })

        expect(registrationToken).toBeNull()
      })

      it('should return updated member in response', async () => {
        const res = await sendRequest()

        expect(res.status).toBe(200)
        expect(_.pick(res.body, _.keys(payload))).toMatchObject(
          _.pick(payload, _.keys(res.body)),
        )
      })
    })
  })

  describe('/forgotten-password', () => {
    afterEach(async () => {
      await RestorationTokenModel.deleteMany({})
    })

    let member
    let association: string | undefined
    let email: string | undefined

    beforeEach(async () => {
      client = undefined

      member = members.find((it) => it.isRegistered)
      association = member.association
      email = member.email
    })

    describe('POST /', () => {
      const sendRequest = () =>
        request(app)
          .post('/api/members/forgotten-password')
          .send({ association, email })

      beforeEach(() => nodemailerMock.reset())

      it('should return 400 response if association is not provided', async () => {
        association = undefined

        const res = await sendRequest()

        expect(res.status).toBe(400)
      })

      it('should return 400 response if email is not provided', async () => {
        email = undefined

        const res = await sendRequest()

        expect(res.status).toBe(400)
      })

      it('should return 204 response even if email is not registered', async () => {
        email = 'not-registered@not-registered.com'

        const res = await sendRequest()

        expect(res.status).toBe(204)
      })

      it('should return 204 response if request is valid', async () => {
        const res = await sendRequest()

        expect(res.status).toBe(204)
      })

      it('should generate restoration token if request is valid', async () => {
        await sendRequest()

        const restorationToken = await RestorationTokenModel.findOne({
          memberId: member._id,
        })

        expect(restorationToken).not.toBeNull()
        expect(restorationToken!.token).toMatch(/[a-f0-9]{40}/)
      })

      it('should send email if request is valid', async () => {
        await sendRequest()

        const restorationToken = await RestorationTokenModel.findOne({
          memberId: member._id,
        })

        const sentEmails = nodemailerMock.getSentMail()

        expect(sentEmails).toHaveLength(1)
        expect(sentEmails[0].from).toBe(config.get('smtp.from'))
        expect(sentEmails[0].to).toBe(email)
        expect(sentEmails[0]['context']).toHaveProperty('restorationLink')
        expect(sentEmails[0]['context'].restorationLink).toContain(member._id)
        expect(sentEmails[0]['context'].restorationLink).toContain(
          restorationToken!.token,
        )
      })
    })
  })
})
