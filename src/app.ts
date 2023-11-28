import 'reflect-metadata'
import express, { Express } from 'express'
import config from 'config'
import helmet from 'helmet'
import morgan from 'morgan'
import errorMiddleware from './middlewares/error'
import { RoutesProvider } from './base/routes-provider'
import mongoose from 'mongoose'
import logger from './logging/logger'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swagger'
import i18n from './middlewares/i18n'
import rateLimiter from './middlewares/rate-limiter'

/**
 * Responsible for assembling the express application.
 */
export class App {
  readonly expressApp: Express = express()

  constructor(opts) {
    this.connectToMongo()
    this.initializeMiddlewares()
    this.initializeRoutes(opts)
    this.initializeSwaggerDocs()
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
    if (config.get('logging.isHttpEnabled')) this.expressApp.use(morgan('tiny'))
    this.expressApp.use('/api', i18n)
    this.expressApp.use('/api', express.json())
  }

  private initializeRoutes(opts) {
    for (const prop in opts) {
      if (prop.endsWith('Routes')) {
        const routes: RoutesProvider = opts[prop]
        this.expressApp.use('/api', rateLimiter, routes.router)
      }
    }
  }

  private initializeSwaggerDocs() {
    this.expressApp.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
    this.expressApp.use('/docs.json', (req, res) => res.json(swaggerSpec))
  }

  private initializeErrorMiddleware() {
    this.expressApp.use(errorMiddleware)
  }
}
