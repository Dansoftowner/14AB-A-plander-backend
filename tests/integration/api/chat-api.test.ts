import { Express } from 'express'
import request from 'supertest'
import config from 'config'
import container from '../../../src/di'
import MemberModel, { Member } from '../../../src/models/member'
import ChatMessageModel from '../../../src/models/chat-message'
import members from '../dummy-data/members.json'
import rawChatMessages from '../dummy-data/chat-messages.json'
import { rateLimiterStore } from '../../../src/middlewares/rate-limiter'
import mongoose from 'mongoose'
import { addSeconds } from 'date-fns'

describe('/api/chats', () => {
  let app: Express
  let client

  const generateToken = async () => {
    if (!client) return ''
    const { generateToken: gen } = await import('../../../src/utils/jwt')
    return gen(client as unknown as Member)
  }

  const chatMessages = rawChatMessages.map((it) => ({
    ...it,
    timestamp: addSeconds(new Date(), Math.floor(Math.random() * 3) + 1),
  }))

  const chatsOfAssociation = () => {
    return chatMessages
      .filter((it) => it.association === client.association)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  beforeAll(async () => {
    app = container.resolve('app').expressApp
    await MemberModel.deleteMany({})
    await ChatMessageModel.deleteMany({})
  })

  beforeEach(async () => {
    client = members[0]

    await MemberModel.insertMany(members)
    await ChatMessageModel.insertMany(chatMessages)

    rateLimiterStore.resetAll()
  })

  afterEach(async () => {
    await MemberModel.deleteMany({})
    await ChatMessageModel.deleteMany({})
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe('GET /', () => {
    let offset: number | undefined
    let limit: number | undefined

    const sendRequest = async () => {
      return request(app)
        .get('/api/chats')
        .query({ offset, limit })
        .set(config.get('jwt.headerName'), await generateToken())
    }

    afterEach(() => {
      offset = limit = undefined
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
      expect(res.body.metadata).toHaveProperty('offset', offset)
      expect(res.body.metadata).toHaveProperty('limit', limit)
    })

    it('should return chat messages', async () => {
      limit = 40

      const res = await sendRequest()

      const chats = chatsOfAssociation()

      const itemsCount = Math.min(chats.length, limit)

      expect(res.body.items.length).toBe(itemsCount)
      expect(res.body.items.map((it) => it._id)).toEqual(
        chats.slice(0, itemsCount).map((it) => it._id),
      )
    })

    it('should apply the given offset', async () => {
      offset = 1

      const res = await sendRequest()

      const chats = chatsOfAssociation()

      expect(res.body.items[0]._id).toBe(chats.map((it) => it._id)[offset])
    })

    it('should apply the given limit', async () => {
      limit = 1

      const res = await sendRequest()

      const chats = chatsOfAssociation()

      expect(res.body.items.length).toBe(Math.min(chats.length, limit))
    })

    it('should return the chat messages sorted descendingly', async () => {
      const res = await sendRequest()

      expect(res.body.items).toEqual(
        res.body.items.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
      )
    })
  })
})
