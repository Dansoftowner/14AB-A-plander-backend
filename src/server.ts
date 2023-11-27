import 'dotenv/config'
import http from 'http'
import logger from './logging/logger'
import container from './di'
import { App } from './app'

const app: App = container.resolve('app')

const server = http.createServer(app.expressApp)

const port = process.env.PORT || 7577

server.listen(port, () => {
  logger.info(`Server is running on port '${port}'`)
})
