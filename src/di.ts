import { createContainer, asClass, asFunction, InjectionMode } from 'awilix'
import express from 'express'
import { App } from './app'
import AssociationService from './api/association/association-service'
import AssociationController from './api/association/association-controller'
import AssocationRoutes from './api/association/association-routes'

const container = createContainer({
  injectionMode: InjectionMode.PROXY,
})

container.register({
  app: asClass(App).singleton(),

  associationService: asClass(AssociationService),
  associationController: asClass(AssociationController),
  associationRoutes: asClass(AssocationRoutes),
})

export default container
