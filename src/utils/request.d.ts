import { AwilixContainer } from 'awilix'

type PlanderRequest = {
  scope: AwilixContainer | undefined
}

declare global {
  namespace Express {
    export interface Request extends PlanderRequest {}
  }
}
