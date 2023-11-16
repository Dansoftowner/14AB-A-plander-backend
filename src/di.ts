import { createContainer, asClass, InjectionMode, Lifetime } from 'awilix'

const container = createContainer({
  injectionMode: InjectionMode.PROXY,
})

export const setupContainer = () => {
  container.loadModules(['app.ts'], {
    formatName: 'camelCase',

    resolverOptions: {
      lifetime: Lifetime.TRANSIENT,
      register: asClass,
    },
  })
}

export default container
