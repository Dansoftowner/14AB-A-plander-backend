import { Server } from 'http'
import container from '../../src/di'
import { App } from '../../src/app'
import { AddressInfo } from 'net'
import mongoose from 'mongoose'
import MemberModel, { Member } from '../../src/models/member'
import ChatMessageModel, { ChatMessage } from '../../src/models/chat-message'
import members from './dummy-data/members.json'
import io from 'socket.io-client'
import { isAfter, isBefore, subSeconds } from 'date-fns'

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

    // init chat service
    container.resolve('chatService')

    await ChatMessageModel.deleteMany({})
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
    await ChatMessageModel.deleteMany({})
  })

  afterAll(async () => {
    await mongoose.connection.close()
    server.close()
    ioServer.close()
  })

  const generateToken = async (member) => {
    if (!member) return ''
    const { generateToken: gen } = await import('../../src/utils/jwt')
    return gen(member)
  }

  const connect = async (member) => {
    return io(connectionURI, { auth: { token: await generateToken(member) } })
  }

  const membersOfAssociation = (association) =>
    members.filter((it) => it.association == association)

  it('should not allow unauthorized clients to connect', async () => {
    const socket = await connect(null)

    await waitFor(socket, 'connect_error')

    expect(socket.connected).toBe(false)
  })

  it('should let authorized clients to connect', async () => {
    const member = members[0]
    const socket = await connect(member)

    await waitFor(socket, 'connect')

    expect(socket.connected).toBe(true)
  })

  it('should send message to other members in the association', async () => {
    const memberA = members[0]
    const memberB = membersOfAssociation(memberA.association)[1]

    const socketA = await connect(memberA)
    const socketB = await connect(memberB)

    socketA.emit('send-message', 'abc')
    await waitFor(socketB, 'recieve-message').then((it: any) => {
      expect(it.sender.name).toBe(memberA.name)
      expect(it.sender._id).toBe(memberA._id)

      expect(isAfter(it.timestamp, subSeconds(new Date(), 3))).toBe(true)
      expect(isBefore(it!.timestamp, new Date())).toBe(true)
      expect(it.content).toBe('abc')
    })
  })

  it("should not send message if it's empty", async () => {
    const memberA = members[0]
    const memberB = membersOfAssociation(memberA.association)[1]

    const socketA = await connect(memberA)
    const socketB = await connect(memberB)

    const spy = jest.fn()
    socketB.on('recieve-message', spy)
    socketA.emit('send-message', '  ')

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(spy).not.toHaveBeenCalled()
        resolve()
      }, 1000)
    })
  })

  it("should not send message if it's over 1024 characters", async () => {
    const memberA = members[0]
    const memberB = membersOfAssociation(memberA.association)[1]

    const socketA = await connect(memberA)
    const socketB = await connect(memberB)

    const spy = jest.fn()
    socketB.on('recieve-message', spy)
    socketA.emit('send-message', 'a'.repeat(1025))

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(spy).not.toHaveBeenCalled()
        resolve()
      }, 1000)
    })
  })

  it('should not send message to other members in other associations', async () => {
    const memberA = members[0]
    const memberB = members.find((it) => it.association !== memberA.association)

    const socketA = await connect(memberA)
    const socketB = await connect(memberB)

    const spy = jest.fn()
    socketB.on('recieve-message', spy)
    socketA.emit('send-message', 'abc')

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(spy).not.toHaveBeenCalled()
        resolve()
      }, 1000)
    })
  })

  it('should save message into database', async () => {
    const memberA = members[0]
    const memberB = membersOfAssociation(memberA.association)[1]

    const socketA = await connect(memberA)
    const socketB = await connect(memberB)

    socketA.emit('send-message', 'abc')
    await waitFor(socketB, 'recieve-message')

    const message = await ChatMessageModel.findOne()

    expect(message).not.toBeNull()
    expect(message!.sender._id.toHexString()).toBe(memberA._id)
    expect(message!.sender.name).toBe(memberA.name)
    expect(message!.association.toHexString()).toBe(memberA.association)
    expect(message!.timestamp > subSeconds(new Date(), 3)).toBe(true)
    expect(message!.timestamp < new Date()).toBe(true)
    expect(message!.content).toBe('abc')
  })
})
