import express, { Router } from 'express'
import { Controller } from './controller'

/**
 * Represents an entity that registers http routes into an express router.
 */
export abstract class RoutesProvider {
  private _router: Router = express.Router()

  protected constructor(controller: Controller) {
    this.initializeRoutes(controller)
  }

  protected abstract initializeRoutes(controller: Controller): void

  public get router() {
    return this._router
  }

  /**
   * Indicates whether rate limiting is handled by this entity.
   */
  public get isRateLimited() {
    return false
  }
}
