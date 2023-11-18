import express, { Router } from 'express'

/**
 * Represents an entity that registers http routes into an express router.
 */
export abstract class RoutesProvider {
  private _router: Router = express.Router()

  protected constructor() {
    this.initializeRoutes()
  }

  protected abstract initializeRoutes()

  public get router() {
    return this._router
  }
}
