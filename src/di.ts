import { createContainer, asClass, asFunction, InjectionMode } from 'awilix'
import express from 'express'
import { App } from './app'
import AssociationService from './api/association/association.service'
import AssociationController from './api/association/association.controller'
import AssocationRoutes from './api/association/association.routes'
import { AssociationRepository } from './api/association/association.repository'

const container = createContainer({
  injectionMode: InjectionMode.PROXY,
})

container.register({
  app: asClass(App).singleton(),

  associationRepository: asClass(AssociationRepository),
  associationService: asClass(AssociationService),
  associationController: asClass(AssociationController),
  associationRoutes: asClass(AssocationRoutes),
})

export default container
