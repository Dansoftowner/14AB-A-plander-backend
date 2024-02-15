import { AwilixContainer } from 'awilix'
import { Socket } from 'socket.io'

type PlanderRequest = {
  scope: AwilixContainer | undefined
}

type PlanderSocket = {
  name: string
  associationId: string
  memberId: string
}

declare global {
  namespace Express {
    export interface Request extends PlanderRequest {}
  }
}

declare module 'socket.io' {
  export interface Socket extends PlanderSocket {}
}
