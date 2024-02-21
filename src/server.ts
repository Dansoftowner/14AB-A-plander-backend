import 'dotenv/config'
import http from 'http'
import logger from './logging/logger'
import container from './di'
import { App } from './app'

const { httpServer } = container.resolve('app') as App
container.resolve('chatService')

const port = process.env.PORT || 7577

httpServer.listen(port, () => {
  logger.info(`Server is running on port '${port}'`)
})
