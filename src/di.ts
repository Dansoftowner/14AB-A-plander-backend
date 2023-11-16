import { createContainer, asClass, asFunction, InjectionMode } from 'awilix'
import express from 'express'
import { App } from './app'

const container = createContainer({
  injectionMode: InjectionMode.PROXY,
})

container.register({
  app: asClass(App).singleton(),
  expressApp: asFunction(express).singleton(),
})

export default container
