import { Express } from 'express'
import helmet from 'helmet'
import errorMiddleware from './middleware/error-middleware'

/**
 * Responsible for assembling the express application.
 */
export class App {
  private expressApp: Express

  constructor(opts) {
    this.expressApp = opts.expressApp
    this.initializeMiddlewares()
    this.initializeControllers(opts)
    this.initializeErrorMiddleware()
  }

  private initializeMiddlewares() {
    this.expressApp.use(helmet())
  }

  private initializeControllers(opts) {}

  private initializeErrorMiddleware() {
    this.expressApp.use(errorMiddleware)
  }
}
