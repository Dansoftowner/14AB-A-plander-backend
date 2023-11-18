import { Express } from 'express'
import config from 'config'
import helmet from 'helmet'
import morgan from 'morgan'
import errorMiddleware from './middleware/error-middleware'
import { RoutesProvider } from './base/routes-provider'

/**
 * Responsible for assembling the express application.
 */
export class App {
  private expressApp: Express

  constructor(opts) {
    this.expressApp = opts.expressApp
    this.initializeMiddlewares()
    this.initializeRoutes(opts)
    this.initializeErrorMiddleware()
  }

  private initializeMiddlewares() {
    this.expressApp.use(helmet())
    if (config.get('logging.isEnabled')) this.expressApp.use(morgan('tiny'))
  }

  private initializeRoutes(opts) {
    for (const prop in opts) {
      if (prop.endsWith('Routes')) {
        const routes: RoutesProvider = opts[prop]
        this.expressApp.use(routes.router)
      }
    }
  }

  private initializeErrorMiddleware() {
    this.expressApp.use(errorMiddleware)
  }
}
