import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import AssociationService from './association-service'
import associationModel from './association-model'

const DEFAULT_OFFSET = 0
const DEFAULT_LIMIT = 10
const DEFAULT_PROJECTION = 'lite'
const DEFAULT_ORDER_BY = 'name'

export default class AssociationController implements Controller {
  private associationService: AssociationService

  constructor({ associationService }) {
    this.associationService = associationService
  }

  async getAssociations(req: Request, res: Response) {
    const { offset, limit, projection, orderBy, q } = this.getPaginationData(req)

    //const items = this.associationService.getAssociations()
    DEFAULT_OFFSET
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
