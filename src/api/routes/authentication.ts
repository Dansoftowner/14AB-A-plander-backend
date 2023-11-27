import { Router } from 'express'
import { Controller } from '../../base/controller'
import { RoutesProvider } from '../../base/routes-provider'
import { AuthenticationController } from '../controllers/authentication'
import asyncErrorHandler from '../../middlewares/async-error-handler'

export class AuthenticationRoutes extends RoutesProvider {
  constructor({ authenticationController }) {
    super(authenticationController)
  }

  protected initializeRoutes(controller: AuthenticationController): void {
    this.router.post(
      '/auth',
      asyncErrorHandler((req, res) => controller.auth(req, res)),
    )
  }
}
