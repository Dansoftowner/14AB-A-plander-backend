import container, {  setupContainer } from './di'

setupContainer()

const app = container.resolve('app')

export { app }
