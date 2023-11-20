import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import AssociationService from './association-service'
import associationModel from './association-model'

export default class AssociationController implements Controller {
  private associationService: AssociationService

  constructor({ associationService }) {
    this.associationService = associationService
  }

  async getAssociations(req: Request, res: Response) {
    const offset = req.query.offset ?? 0
    const limit = req.query.limit ?? 10
    const projection = req.query.projection
    const orderBy = req.query.orderBy
    const q = req.query.q

    const associations = await associationModel.find({})

    res.json({
      metadata: {
        total: await associationModel.countDocuments(),
        offset,
        limit,
      },
      items: associations,
    })
  }
}
