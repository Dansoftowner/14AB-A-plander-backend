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
    const { offset, limit, projection, orderBy, q } = this.getPaginationData(req)

    const associations = await associationModel.find({}).skip(offset)

    res.json({
      metadata: {
        total: await associationModel.countDocuments(),
        offset,
        limit,
      },
      items: associations,
    })
  }

  private getPaginationData(req: Request) {
    const { offset, limit, projection, orderBy, q } = req.query
    return {
      offset: Number.parseInt((offset as string) ?? 0),
      limit: Number.parseInt((limit as string) ?? 10),
      projection,
      orderBy,
      q,
    }
  }
}
