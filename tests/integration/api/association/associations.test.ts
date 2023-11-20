import { Server } from 'http'
import request from 'supertest'
import associationModel from '../../../../src/api/association/association-model'
import container from '../../../../src/di'

describe('/api/associations', () => {
  let app: Server

  beforeEach(() => {
    container.resolve('app')
    app = container.resolve('expressApp')
  })

  afterEach(async () => {
    await associationModel.deleteMany({})
  })

  describe('GET /api/associations', () => {
    describe('/', () => {
      let offset: number
      let limit: number
      let projection: string
      let orderBy: string
      let q: string

      const sendRequest = () => {
        return request(app).get('/api/associations').query({
          offset,
          limit,
          projection,
          orderBy,
          q,
        })
      }

      it('should contain metadata', async () => {
        await associationModel.insertMany([
          { name: 'Assoc', certificate: '07/0001', location: 'mama hotel' },
          { name: 'Assoc2', certificate: '07/0002', location: 'mama hotel2' },
        ])

        const res = await sendRequest()

        expect(res.body.metadata).toBeDefined()
        expect(res.body.metadata).toHaveProperty('total', 2)
        expect(res.body.metadata).toHaveProperty('offset')
        expect(res.body.metadata).toHaveProperty('limit')
      })

      it('should return all associations', async () => {
        await associationModel.insertMany([
          { name: 'Assoc', certificate: '07/0001', location: 'mama hotel' },
          { name: 'Assoc2', certificate: '07/0002', location: 'mama hotel2' },
        ])

        const res = await sendRequest()

        expect(res.body.items.length).toBe(2)
        expect(res.body.items.some((it) => it.name === 'Assoc')).toBe(true)
        expect(res.body.items.some((it) => it.name === 'Assoc2')).toBe(true)
      })
    })
  })
})
