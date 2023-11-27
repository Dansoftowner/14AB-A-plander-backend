import { createContainer, asClass, asFunction, InjectionMode } from 'awilix'
import express from 'express'
import { App } from './app'
import AssociationService from './services/association'
import AssociationController from './api/controllers/association'
import AssocationRoutes from './api/routes/associations'
import { AssociationRepository } from './repositories/association'
import { AuthenticationController } from './api/controllers/authentication'
import { AuthenticationRoutes } from './api/routes/authentication'

const container = createContainer({
  injectionMode: InjectionMode.PROXY,
})

container.register({
  app: asClass(App).singleton(),

  associationRepository: asClass(AssociationRepository),
  associationService: asClass(AssociationService),
  associationController: asClass(AssociationController),
  associationRoutes: asClass(AssocationRoutes),

  authenticationController: asClass(AuthenticationController),
  authenticationRoutes: asClass(AuthenticationRoutes),
})

export default container
