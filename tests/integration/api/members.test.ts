import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { Express } from 'express'
import request from 'supertest'
import _ from 'lodash'
import config from 'config'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import { NodemailerMock } from 'nodemailer-mock'
import MemberModel, { Member } from '../../../src/models/member'
import container from '../../../src/di'
import { rateLimiterStore } from '../../../src/middlewares/rate-limiter'
import RegistrationTokenModel from '../../../src/models/registration-token'
import RestorationTokenModel from '../../../src/models/restoration-token'
import members from '../dummy-data/members.json'
import AssociationModel from '../../../src/models/association'

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
    const { generateToken: gen } = await import('../../../src/utils/jwt')
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

      expect(_.keys(registeredMember)).not.toContain(['address', 'idNumber'])
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

    afterEach(async () => {
      await RegistrationTokenModel.deleteMany({})
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
      payload.email = companionMembers()
        .filter((it) => it.isRegistered)
        .find((it) => it._id != client._id)!.email

      const res = await sendRequest()

      expect(res.status).toBe(422)
    })

    it('should save invited member to the database', async () => {
      const res = await sendRequest()

      const invitedMember = await MemberModel.findOne({
        association: client.association,
        email: payload.email,
      })

      expect(res.status).toBe(202)
      expect(invitedMember).not.toBeNull()
      expect(invitedMember!.isRegistered).toBe(false)
    })

    it('should return the invited member', async () => {
      const res = await sendRequest()

      expect(res.status).toBe(202)
      expect(res.body).toMatchObject(_.pickBy(payload, (it) => it !== undefined))
    })

    it('should generate a registration token for the invited member', async () => {
      const res = await sendRequest()

      const registrationToken = await RegistrationTokenModel.findOne({
        memberId: res.body._id,
      })

      expect(registrationToken).not.toBeNull()
    })

    it('should not spam database with registration tokens for the same member', async () => {
      await sendRequest()
      await sendRequest()

      const registrationTokens = await RegistrationTokenModel.find()

      expect(registrationTokens).toHaveLength(1)
    })

    it('should send email for the invited member', async () => {
      const res = await sendRequest()

      const memberId = res.body._id

      const sentEmails = nodemailerMock.getSentMail()

      expect(sentEmails).toHaveLength(1)
      expect(sentEmails[0].from).toBe(config.get('smtp.from'))
      expect(sentEmails[0].to).toBe(payload.email)
      expect(sentEmails[0].html).toMatch(new RegExp(res.body.name))
      expect(sentEmails[0].html).toMatch(
        new RegExp(`${config.get('frontend.host')}/register/${memberId}/[a-f0-9]{40}`),
      )
    })

    it('should use the email address as the invocation in the email if name is not specified', async () => {
      payload.name = undefined

      const res = await sendRequest()

      const sentEmails = nodemailerMock.getSentMail()

      const invocation = payload.email!.substring(0, payload.email!.indexOf('@'))

      expect(sentEmails).toHaveLength(1)
      expect(sentEmails[0].html).toMatch(new RegExp(invocation))
    })

    it('should update invited member data if the president triggers the invite again', async () => {
      await sendRequest()

      payload.name = 'Other Name'
      payload.phoneNumber = '+36 30 210 8787'

      const res = await sendRequest()

      const invitedMember = await MemberModel.findOne({
        association: client.association,
        email: payload.email,
      })

      expect(res.status).toBe(202)
      expect(invitedMember).toHaveProperty('name', payload.name)
      expect(invitedMember).toHaveProperty('phoneNumber', payload.phoneNumber)
      expect(invitedMember!.isRegistered).toBe(false)
    })

    it('should regenerate registration token if president triggers the invite again', async () => {
      let res = await sendRequest()

      const oldRegistrationToken = await RegistrationTokenModel.findOne({
        memberId: res.body._id,
      })

      res = await sendRequest()

      const newRegistrationToken = await RegistrationTokenModel.findOne({
        memberId: res.body._id,
      })

      expect(oldRegistrationToken!.token).not.toEqual(newRegistrationToken!.token)
    })

    it('should resend email if president triggers the invite again', async () => {
      await sendRequest()
      const res = await sendRequest()

      const memberId = res.body._id

      const sentEmails = nodemailerMock.getSentMail()

      expect(sentEmails).toHaveLength(2)
      expect(sentEmails[1].from).toBe(config.get('smtp.from'))
      expect(sentEmails[1].to).toBe(payload.email)
    })
  })

  describe('/register/:id/:registrationToken', () => {
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
        token: bcrypt.hashSync(token, 1),
      }).save()
    })

    describe('GET /', () => {
      let association

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
        association = await AssociationModel.findOneAndReplace(
          { _id: member.association },
          {
            _id: member.association,
            name: 'Example',
            location: 'Loc 12',
            certificate: '12/1234',
          },
          { upsert: true, new: true },
        )
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

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject(
          _.pick(
            member,
            _.keys(res.body).filter((it) => it !== 'association'),
          ),
        )
      })

      it('should return association in nested structure', async () => {
        const res = await sendRequest()

        expect(res.body.association._id).toBe(association._id.toHexString())
        expect(res.body.association.name).toBe(association.name)
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
    let associationId: string | undefined
    let email: string | undefined

    beforeEach(async () => {
      client = undefined

      member = members.find((it) => it.isRegistered)
      associationId = member.association
      email = member.email
    })

    describe('POST /', () => {
      const sendRequest = () =>
        request(app)
          .post('/api/members/forgotten-password')
          .send({ associationId, email })

      beforeEach(() => nodemailerMock.reset())

      it('should return 400 response if association is not provided', async () => {
        associationId = undefined

        const res = await sendRequest()

        expect(res.status).toBe(400)
      })

      it('should return 400 response if email is not provided', async () => {
        email = undefined

        const res = await sendRequest()

        expect(res.status).toBe(400)
      })

      it('should return 202 response even if email is not registered', async () => {
        email = 'not-registered@not-registered.com'

        const res = await sendRequest()

        expect(res.status).toBe(202)
      })

      it('should return 202 response if request is valid', async () => {
        const res = await sendRequest()

        expect(res.status).toBe(202)
      })

      it('should generate restoration token if request is valid', async () => {
        await sendRequest()

        const restorationToken = await RestorationTokenModel.findOne({
          memberId: member._id,
        })

        expect(restorationToken).not.toBeNull()
      })

      it('should not spam database with restoration tokens for the same member', async () => {
        await sendRequest()
        await sendRequest()

        const restorationTokens = await RestorationTokenModel.find({
          memberId: member._id,
        })

        expect(restorationTokens).toHaveLength(1)
      })

      it('should not generate restoration token if the member with the given email is unregistered', async () => {
        await MemberModel.findByIdAndUpdate(member._id, { isRegistered: false })

        const restorationToken = await RestorationTokenModel.findOne({
          memberId: member._id,
        })

        expect(restorationToken).toBeNull()
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
        expect(sentEmails[0].html).toMatch(new RegExp(member.name))
        expect(sentEmails[0].html).toMatch(
          new RegExp(
            `${config.get('frontend.host')}/forgotten-password/${
              member._id
            }/[a-f0-9]{40}`,
          ),
        )
      })
    })

    describe('POST /:id/:restorationToken', () => {
      let id: string
      let token: string

      let newPassword: string | undefined

      const sendRequest = () =>
        request(app)
          .post(`/api/members/forgotten-password/${id}/${token}`)
          .send({ password: newPassword })

      beforeEach(async () => {
        id = member._id
        token = crypto.randomBytes(20).toString('hex')
        newPassword = 'IWontForgetItAgain7'

        await new RestorationTokenModel({
          memberId: id,
          token: bcrypt.hashSync(token, 1),
        }).save()
      })

      it('should return 404 response if the given id is not a valid object id', async () => {
        id = '123'

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should return 404 response if the id does not exist', async () => {
        id = new mongoose.Types.ObjectId().toHexString()

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should return 404 response if token is invalid', async () => {
        token = crypto.randomBytes(20).toString('hex')

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should return 400 response if new password is not specified', async () => {
        newPassword = undefined

        const res = await sendRequest()

        expect(res.status).toBe(400)
      })

      it.each(['aBc12', 'abcdefgh', 'Abcdefgh', '123456789'])(
        'should return 400 response if password is weak',
        async (pass) => {
          newPassword = pass

          const res = await sendRequest()

          expect(res.status).toBe(400)
        },
      )

      it('should update password in database', async () => {
        await sendRequest()

        const memberInDb = await MemberModel.findById(id)

        expect(memberInDb).not.toBeNull()
        expect(memberInDb!.password).not.toBe(member.password)
        expect(bcrypt.compareSync(newPassword!, memberInDb!.password!)).toBe(true)
      })

      it('should remove restoration token from database', async () => {
        await sendRequest()

        const restorationToken = await RestorationTokenModel.findOne({
          memberId: id,
        })

        expect(restorationToken).toBeNull()
      })
    })
  })

  describe('/me/credentials', () => {
    describe('PATCH /', () => {
      let email: string | undefined
      let username: string | undefined
      let password: string | undefined
      let oldPassword: string

      const sendRequest = async () =>
        request(app)
          .patch('/api/members/me/credentials')
          .set(config.get('jwt.headerName'), await generateToken())
          .set(config.get('headers.currentPass'), oldPassword!)
          .send({ email, username, password })

      beforeEach(async () => {
        email = 'newEmail@new.com'
        username = 'NewUsername123'
        password = 'NewSafePassword123'
        oldPassword = 'Gizaac0Password'
      })

      it('should return 401 message if client is not logged in', async () => {
        client = undefined

        const res = await sendRequest()

        expect(res.status).toBe(401)
      })

      it('should return 401 message if client did not specify the current password', async () => {
        oldPassword = ''

        const res = await sendRequest()

        expect(res.status).toBe(401)
      })

      it('should return 401 message if the specified current password is invalid', async () => {
        oldPassword = '123'

        const res = await sendRequest()

        expect(res.status).toBe(401)
      })

      it('should return 400 message if neither of email, username and password is specified', async () => {
        email = username = password = undefined

        const res = await sendRequest()

        expect(res.status).toBe(400)
      })

      it.each(['@mail.com', 'xsa2'])(
        'it should return 400 message if invalid email is specified',
        async (value) => {
          email = value

          const res = await sendRequest()

          expect(res.status).toBe(400)
        },
      )

      it.each(['123', 'abc', '<?Sani>!'])(
        'should return 400 message if invalid username is specified',
        async (value) => {
          username = value

          const res = await sendRequest()

          expect(res.status).toBe(400)
        },
      )

      it.each(['aBc12', 'abcdefgh', 'Abcdefgh', '123456789'])(
        'should return 400 response if password is weak',
        async (pass) => {
          password = pass

          const res = await sendRequest()

          expect(res.status).toBe(400)
        },
      )

      it('should return 422 message if email is already in use', async () => {
        email = companionMembers().find((it) => it != client)!.email

        const res = await sendRequest()

        expect(res.status).toBe(422)
      })

      it('should return 422 message if username is already in use', async () => {
        username = companionMembers().find((it) => it != client)!.username

        const res = await sendRequest()

        expect(res.status).toBe(422)
      })

      it('should update email in database', async () => {
        username = password = undefined

        await sendRequest()

        const memberInDb = await MemberModel.findById(client._id)

        expect(memberInDb).toHaveProperty('email', email)
      })

      it('should update username in database', async () => {
        email = password = undefined

        await sendRequest()

        const memberInDb = await MemberModel.findById(client._id)

        expect(memberInDb).toHaveProperty('username', username)
      })

      it('should update password', async () => {
        email = username = undefined

        await sendRequest()

        const memberInDb = await MemberModel.findById(client._id)

        expect(bcrypt.compareSync(password!, memberInDb!.password!)).toBe(true)
      })

      it('should update email, username and password', async () => {
        await sendRequest()

        const memberInDb = await MemberModel.findById(client._id)

        expect(memberInDb).toHaveProperty('email', email)
        expect(memberInDb).toHaveProperty('username', username)
        expect(bcrypt.compareSync(password!, memberInDb!.password!)).toBe(true)
      })

      it('should return 204 response', async () => {
        const res = await sendRequest()

        expect(res.status).toBe(204)
      })
    })
  })

  describe('PATCH /:id', () => {
    let id: string
    let payload: {
      name: string | undefined
      address: string | undefined
      idNumber: string | undefined
      phoneNumber: string | undefined
      guardNumber: string | undefined
    }

    const sendRequest = async () =>
      request(app)
        .patch(`/api/members/${id}`)
        .set(config.get('jwt.headerName'), await generateToken())
        .send(payload)

    beforeEach(async () => {
      id = companionMembers().find((it) => !it.isRegistered)!._id

      payload = {
        name: 'New Name',
        address: 'NewAddress123',
        idNumber: '514371NW',
        phoneNumber: '+32 40 123 1212',
        guardNumber: '11/1111/111111',
      }
    })

    it('should return 401 response if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 404 response if invalid object-id is passed', async () => {
      id = '123'

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 404 response if no member with the given id exist', async () => {
      id = new mongoose.Types.ObjectId().toHexString()

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it.each([
      ['name', '123'],
      ['address', 'abc'],
      ['guardNumber', '00'],
    ])('should return 400 response if payload is invalid', async (property, value) => {
      payload[property] = value

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 404 response if the client wants to update a member outside of the association', async () => {
      id = members.find((it) => it.association != client.association)!._id

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 409 error if id number is reserved', async () => {
      payload.idNumber = companionMembers()
        .filter((it) => it.isRegistered)
        .find((it) => it._id !== id)!.idNumber

      const res = await sendRequest()

      expect(res.status).toBe(409)
    })

    it('should return 403 response if the client is not a president and wants to update another member', async () => {
      client = regularMember

      const res = await sendRequest()

      expect(res.status).toBe(403)
    })

    it('should return 403 response if the client wants to update a registered member', async () => {
      id = companionMembers()
        .filter((it) => it.isRegistered)
        .find((it) => it !== client)!._id

      const res = await sendRequest()

      expect(res.status).toBe(403)
    })

    it('should update member in database', async () => {
      await sendRequest()

      const memberInDb = await MemberModel.findById(id)

      expect(_.pick(memberInDb, _.keys(payload))).toMatchObject(payload)
    })

    it('should update self in database', async () => {
      id = client._id

      await sendRequest()

      const memberInDb = await MemberModel.findById(id)

      expect(_.pick(memberInDb, _.keys(payload))).toMatchObject(payload)
    })

    it('should update self in database even if not president', async () => {
      client = regularMember
      id = client._id

      await sendRequest()

      const memberInDb = await MemberModel.findById(id)

      expect(_.pick(memberInDb, _.keys(payload))).toMatchObject(payload)
    })

    it('should return update member in response body', async () => {
      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(_.pick(res.body, _.keys(payload))).toMatchObject(payload)
    })
  })

  describe('PATCH /me', () => {
    let payload: {
      name: string | undefined
      address: string | undefined
      idNumber: string | undefined
      phoneNumber: string | undefined
      guardNumber: string | undefined
    }

    const sendRequest = async () =>
      request(app)
        .patch('/api/members/me')
        .set(config.get('jwt.headerName'), await generateToken())
        .send(payload)

    beforeEach(async () => {
      payload = {
        name: 'New Name',
        address: 'NewAddress123',
        idNumber: '514371NW',
        phoneNumber: '+32 40 123 1212',
        guardNumber: '11/1111/111111',
      }
    })

    it('should return 401 response if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it.each([
      ['name', '123'],
      ['address', 'abc'],
      ['guardNumber', '00'],
    ])('should return 400 response if payload is invalid', async (property, value) => {
      payload[property] = value

      const res = await sendRequest()

      expect(res.status).toBe(400)
    })

    it('should return 409 error if id number is reserved', async () => {
      payload.idNumber = companionMembers()
        .filter((it) => it.isRegistered)
        .find((it) => it !== client)!.idNumber

      const res = await sendRequest()

      expect(res.status).toBe(409)
    })

    it('should update member in database', async () => {
      await sendRequest()

      const memberInDb = await MemberModel.findById(client._id)

      expect(_.pick(memberInDb, _.keys(payload))).toMatchObject(payload)
    })

    it('should return update member in response body', async () => {
      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(_.pick(res.body, _.keys(payload))).toMatchObject(payload)
    })
  })

  describe('DELETE /:id', () => {
    let id: string
    let currentPassword: string

    const sendRequest = async () =>
      request(app)
        .delete(`/api/members/${id}`)
        .set(config.get('jwt.headerName'), await generateToken())
        .set(config.get('headers.currentPass'), currentPassword)
        .send()

    beforeEach(() => {
      id = companionMembers()
        .filter((it) => it._id !== client._id)
        .find((it) => it.isRegistered)!._id

      currentPassword = 'Gizaac0Password'
    })

    it('should return 401 message if client is not logged in', async () => {
      client = undefined

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 401 message if client did not specify his password', async () => {
      currentPassword = ''

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 401 message if client specified the password incorrectly', async () => {
      currentPassword = 'abc1241A'

      const res = await sendRequest()

      expect(res.status).toBe(401)
    })

    it('should return 403 message if client is not president', async () => {
      client = regularMember

      const res = await sendRequest()

      expect(res.status).toBe(403)
    })

    it('should return 404 message if the given id is invalid', async () => {
      id = '123'

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 404 message if member with the given id does not exist', async () => {
      id = new mongoose.Types.ObjectId().toHexString()

      const res = await sendRequest()

      expect(res.status).toBe(404)
    })

    it('should return 403 message if a president wants to remove another president', async () => {
      const otherPresident = new MemberModel({
        isRegistered: true,
        association: client.association,
        roles: ['member', 'president'],
      })
      await otherPresident.save({ validateBeforeSave: false })

      id = otherPresident._id.toHexString()
      const res = await sendRequest()

      expect(res.status).toBe(403)
    })

    it('should return 422 message if a president wants to delete himself but there are no other presidents in the group', async () => {
      id = client._id

      const res = await sendRequest()

      expect(res.status).toBe(422)
    })

    it('should delete member from database', async () => {
      const res = await sendRequest()

      const member = await MemberModel.findById(id)

      expect(res.status).toBe(200)
      expect(member).toBeNull()
    })

    it('should delete president from database if there are other presidents', async () => {
      const otherPresident = new MemberModel({
        isRegistered: true,
        association: client.association,
        roles: ['member', 'president'],
      })
      await otherPresident.save({ validateBeforeSave: false })

      id = client._id

      const res = await sendRequest()

      const member = await MemberModel.findById(id)

      expect(res.status).toBe(200)
      expect(member).toBeNull()
    })

    it('should return deleted member in the payload', async () => {
      const res = await sendRequest()

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject(
        _.omit(members.find((it) => it._id === id)!, [
          'association',
          'password',
          'preferences',
        ]),
      )
    })
  })

  describe('/me/preferences', () => {
    describe('GET /', () => {
      const sendRequest = async () =>
        request(app)
          .get('/api/members/me/preferences')
          .set(config.get('jwt.headerName'), await generateToken())
          .send()

      it('should return 401 if client is not logged in', async () => {
        client = undefined

        const res = await sendRequest()

        expect(res.status).toBe(401)
      })

      it('should return 404 response if client is not in the database', async () => {
        await MemberModel.findByIdAndDelete(client._id)

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should return preferences of the client', async () => {
        const res = await sendRequest()

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject(client!.preferences)
      })

      it('should return empty object if client has no preferences', async () => {
        client = await new MemberModel({
          isRegistered: true,
          association: client.association,
          roles: ['member'],
        }).save({ validateBeforeSave: false })

        const res = await sendRequest()

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject({})
      })
    })

    describe('PATCH /', () => {
      let preferences: any

      const sendRequest = async () =>
        request(app)
          .patch('/api/members/me/preferences')
          .set(config.get('jwt.headerName'), await generateToken())
          .send(preferences)

      beforeEach(() => {
        preferences = {
          key1: 'value1',
          key2: 'value2',
        }
      })

      it('should return 401 if client is not logged in', async () => {
        client = undefined

        const res = await sendRequest()

        expect(res.status).toBe(401)
      })

      it('should return 404 response if client is not in the database', async () => {
        await MemberModel.findByIdAndDelete(client._id)

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should return 400 response if a value is a nested object', async () => {
        preferences.key3 = { other: 'value' }

        const res = await sendRequest()

        expect(res.status).toBe(400)
      })

      it('should return 400 response if too many keys are sent', async () => {
        new Array(11).fill(null).forEach((_, i) => {
          preferences[`key${i}`] = 'value'
        })

        const res = await sendRequest()

        expect(res.status).toBe(400)
      })

      it('should return 400 response if a value is a nested object inside an array', async () => {
        preferences.key3 = [{ other: 'value' }]

        const res = await sendRequest()

        expect(res.status).toBe(400)
      })

      it.each(['$key', 'key.key'])(
        'should return 400 response if property names include forbidden characters',
        async (key) => {
          preferences[key] = 'value'

          const res = await sendRequest()

          expect(res.status).toBe(400)
        },
      )

      it('should add preferences to the member in database', async () => {
        await sendRequest()

        const preferencesInDb = (await MemberModel.findById(client._id))!.preferences

        expect(_.pick(preferencesInDb, _.keys(preferences))).toMatchObject(preferences)
      })

      it('should add preferences to the member in database if no preferences were before', async () => {
        await MemberModel.findByIdAndUpdate(client._id, {
          $unset: ['preferences'],
        })

        await sendRequest()

        const preferencesInDb = (await MemberModel.findById(client._id))!.preferences

        expect(_.pick(preferencesInDb, _.keys(preferences))).toMatchObject(preferences)
      })

      it('should update preferences of the member in database', async () => {
        await MemberModel.findByIdAndUpdate(client._id, {
          $set: {
            preferences: {
              key1: 'toBeUpdated',
            },
          },
        })

        await sendRequest()

        const preferencesInDb = (await MemberModel.findById(client._id))!.preferences

        expect(preferencesInDb).toEqual(preferences)
      })

      it('should remove preferences of the member in database', async () => {
        await MemberModel.findByIdAndUpdate(client._id, {
          $set: {
            preferences: {
              key1: 'something',
            },
          },
        })

        preferences.key1 = null

        await sendRequest()

        const preferencesInDb = (await MemberModel.findById(client._id))!.preferences

        expect(preferencesInDb).not.toHaveProperty('key1')
      })

      it('should return updated preferences in the payload', async () => {
        const res = await sendRequest()

        expect(res.status).toBe(200)
        expect(_.pick(res.body, _.keys(preferences))).toMatchObject(preferences)
      })
    })
  })

  describe('/api/members/transfer-my-roles/{id}', () => {
    describe('PATCH /', () => {
      let id: string
      let password: string
      let copy: boolean | undefined

      const sendRequest = async () =>
        request(app)
          .patch(`/api/members/transfer-my-roles/${id}`)
          .set(config.get('jwt.headerName'), await generateToken())
          .set(config.get('headers.currentPass'), password!)
          .query({ copy })
          .send()

      beforeEach(() => {
        id = companionMembers().find((it) => it.isRegistered && it !== client)!._id
        password = 'Gizaac0Password'
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

      it('should return 401 response if client provided the wrong password', async () => {
        password = 'wrongPassword'

        const res = await sendRequest()

        expect(res.status).toBe(401)
      })

      it('should return error response if client is not in the database', async () => {
        await MemberModel.findByIdAndDelete(client._id)

        const res = await sendRequest()

        expect(res.ok).not.toBe(true)
      })

      it('should return 404 response if member is not in the database', async () => {
        id = new mongoose.Types.ObjectId().toString()

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should return 404 response if member is not in the same association', async () => {
        id = members
          .filter((it) => it.association !== client.association)
          .find((it) => it.isRegistered)!._id

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should return 404 response if member is not registered', async () => {
        id = companionMembers().find((it) => !it.isRegistered)!._id

        const res = await sendRequest()

        expect(res.status).toBe(404)
      })

      it('should transfer roles from client to member', async () => {
        await sendRequest()

        const memberInDb = await MemberModel.findById(id)
        const clientInDb = await MemberModel.findById(client._id)

        expect(memberInDb!.roles).toEqual(client.roles)
        expect(clientInDb!.roles).not.toEqual(client.roles)
      })

      it('should copy roles from client to member if `copy` query param is true', async () => {
        copy = true

        await sendRequest()

        const memberInDb = await MemberModel.findById(id)
        const clientInDb = await MemberModel.findById(client._id)

        expect(memberInDb!.roles).toEqual(clientInDb!.roles)
        expect(clientInDb!.roles).toEqual(client.roles)
      })

      it('should return id and roles in response', async () => {
        const res = await sendRequest()

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject({
          _id: id,
          roles: client.roles,
        })
      })
    })
  })
})
