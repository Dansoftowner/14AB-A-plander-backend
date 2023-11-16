import { createContainer, asClass, InjectionMode, Lifetime } from 'awilix'
import { App } from './app'

const container = createContainer({
  injectionMode: InjectionMode.PROXY,
})

container.register({
  app: asClass(App).singleton(),
})

export default container
