import _ from 'lodash'
import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import AssociationService from './association-service'
import { getPaginationData } from '../../utils/pagination'

const PROJECTION_PARAM_NAME = 'projection'
const SORT_PARAM_NAME = 'orderBy'
const SEARCH_PARAM_NAME = 'q'

const DEFAULT_PROJECTION = 'lite'
const DEFAULT_SORT = 'name'

const projectionMap = {
  lite: '_id name',
  full: '-__v',
}

export default class AssociationController implements Controller {
  private associationService: AssociationService

  constructor({ associationService }) {
    this.associationService = associationService
  }

  async getAssociations(req: Request, res: Response) {
    const paginationData = getPaginationData(req)
    const projection = this.extractProjection(req)
    const sort = this.extractSort(req)
    const searchTerm = this.extractSearchTerm(req)

    const total = await this.associationService.getCount()
    const items = await this.associationService.getAll({
      ...paginationData,
      projection,
      sort,
      searchTerm,
    })

    res.json({
      metadata: {
        total,
        ...paginationData,
      },
      items,
    })
  }

  private extractProjection(req: Request): string {
    const raw = req.query[PROJECTION_PARAM_NAME] as string
    if (_.keys(projectionMap).includes(raw)) return projectionMap[raw]
    return projectionMap[DEFAULT_PROJECTION]
  }

  private extractSort(req: Request): string {
    const raw = req.query[SORT_PARAM_NAME] as string
    return raw || DEFAULT_SORT
  }

  private extractSearchTerm(req: Request): string | undefined {
    // TODO: sanitize
    return req.query[SEARCH_PARAM_NAME]?.toString()
  }
}
