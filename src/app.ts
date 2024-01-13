import 'reflect-metadata'
import express, { Express, RequestHandler } from 'express'
import config from 'config'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoose from 'mongoose'
import swaggerUi from 'swagger-ui-express'
import errorMiddleware from './middlewares/error'
import { RoutesProvider } from './base/routes-provider'
import logger from './logging/logger'
import swaggerSpec from './swagger'
import i18n from './middlewares/i18n'
import rateLimiter from './middlewares/rate-limiter'
import cors from 'cors'

/**
 * Responsible for assembling the express application.
 */
export class App {
  readonly expressApp: Express = express()

  constructor(opts) {
    this.requireCrucialConfig()
    this.connectToMongo()
    this.initializeMiddlewares()
    this.initializeRoutes(opts)
    this.initializeSwaggerDocs()
    this.initializeErrorMiddleware()
  }

  private requireCrucialConfig() {
    ;['mongo.uri', 'jwt.privateKey', 'frontend.host'].forEach((it) => {
      if (!(config.has(it) && config.get(it)))
        throw new Error(`FATAL ERROR: ${it} config is not set.`)
    })
  }

  private connectToMongo() {
    mongoose
      .connect(config.get('mongo.uri'))
      .then(() => logger.info('Connection with MongoDB established.'))
      .catch(() => logger.error('Connection with MongoDB failed!'))
  }

  private initializeMiddlewares() {
    this.expressApp.use(express.static('public'))
    this.expressApp.use(this.buildCorsMiddleware())
    this.expressApp.use(helmet())
    if (config.get('logging.isHttpEnabled')) this.expressApp.use(morgan('tiny'))
    this.expressApp.use('/api', i18n)
    this.expressApp.use('/api', express.json())
  }

  private initializeRoutes(opts) {
    for (const prop in opts) {
      if (prop.endsWith('Routes')) {
        const routes: RoutesProvider = opts[prop]

        const routeMiddlewares: RequestHandler[] = []
        if (!routes.isRateLimited) routeMiddlewares.push(rateLimiter)

        this.expressApp.use(
          ['/api', routes.prefix].join('/'),
          routeMiddlewares,
          routes.router,
        )
      }
    }
  }

  private initializeSwaggerDocs() {
    const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
      customSiteTitle: 'Plander API Docs',
      customCssUrl: '/css/swagger-dark.css',
    }

    this.expressApp.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, swaggerUiOptions),
    )

    this.expressApp.use('/docs.json', (req, res) => res.json(swaggerSpec))
  }

  private initializeErrorMiddleware() {
    this.expressApp.use(errorMiddleware)
  }

  private buildCorsMiddleware() {
    return cors({
      origin: process.env.NODE_ENV === 'development' || config.get('frontend.host'),
      credentials: true,
      exposedHeaders: [config.get('jwt.headerName')],
    })
  }
}
