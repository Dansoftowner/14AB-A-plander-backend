import http from 'http'
import logger from './logging/logger'
import container from './di'

container.resolve('app')

const server = http.createServer(container.resolve('expressApp'))

const port = process.env.PORT || 7577

export default server.listen(port, () => {
  logger.info(`Server is running on port '${port}'`)
})
