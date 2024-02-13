import { Server } from 'http'
import container from '../../../src/di'
import { App } from '../../../src/app'
import { AddressInfo } from 'net'
import mongoose from 'mongoose'
import MemberModel, { Member } from '../../../src/models/member'
import members from '../dummy-data/members.json'
import io from 'socket.io-client'

function waitFor(socket, event) {
  return new Promise((resolve) => {
    socket.once(event, resolve)
  })
}

describe('Chatting', () => {
  let server: import('http').Server
  let ioServer: import('socket.io').Server
  let connectionURI: string

  beforeAll(async () => {
    const app: App = container.resolve('app')
    server = app.httpServer
    ioServer = app.io

    await MemberModel.deleteMany({})
    await new Promise<void>((resolve) => {
      server.on('listening', () => {
        connectionURI = `ws://localhost:${(server.address() as AddressInfo)!.port}`
        resolve()
      })

      server.listen(0)
    })
  })

  beforeEach(async () => {
    await MemberModel.insertMany(members)
  })

  afterEach(async () => {
    await MemberModel.deleteMany({})
  })

  afterAll(async () => {
    await mongoose.connection.close()
    server.close()
    ioServer.close()
  })

  const generateToken = async (member) => {
    if (!member) return ''
    const { generateToken: gen } = await import('../../../src/utils/jwt')
    return gen(member)
  }

  const connect = async (member) => {
    return io(connectionURI, { auth: { token: await generateToken(member) } })
  }

  it('should not allow unauthorized clients to connect', async () => {
    const socket = await connect(null)

    let error = false
    await waitFor(socket, 'connect_error').then(() => (error = true))

    expect(error).toBe(true)
  })

  it('should let authorized clients to connect', async () => {
    const member = members[0]
    const socket = await connect(member)

    await waitFor(socket, 'connect')

    expect(socket.connected).toBe(true)
  })
})
