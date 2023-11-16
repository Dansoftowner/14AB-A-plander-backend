import container from './di'

const app = container.resolve('app')

export { app }
