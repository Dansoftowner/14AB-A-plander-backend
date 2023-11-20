import { Express } from 'express'
import config from 'config'
import helmet from 'helmet'
import morgan from 'morgan'
import errorMiddleware from './middleware/error-middleware'
import { RoutesProvider } from './base/routes-provider'
import mongoose from 'mongoose'
import logger from './logging/logger'

/**
 * Responsible for assembling the express application.
 */
export class App {
  private expressApp: Express

  constructor(opts) {
    this.expressApp = opts.expressApp
    this.connectToMongo()
    this.initializeMiddlewares()
    this.initializeRoutes(opts)
    this.initializeErrorMiddleware()
  }

  private connectToMongo() {
    mongoose
      .connect(config.get('mongo.uri'))
      .then(() => logger.info('Connection with MongoDB established.'))
      .catch(() => logger.error('Connection with MongoDB failed!'))
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
