import http from 'http'
import container from './di'

container.resolve('app')

const server = http.createServer(container.resolve('expressApp'))

const port = process.env.PORT || 7577

export default server.listen(port, () => {
  // TODO: log message
})
