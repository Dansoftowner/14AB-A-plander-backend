import _ from 'lodash'
import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import AssociationService from './association-service'
import {
  getPaginationData,
  getProjection,
  getSearchQuery,
  getSort,
} from '../../utils/api-commons'

export default class AssociationController implements Controller {
  private associationService: AssociationService

  constructor({ associationService }) {
    this.associationService = associationService
  }

  async getAssociations(req: Request, res: Response) {
    const paginationData = getPaginationData(req)
    const projection = getProjection(req, { lite: '_id name', full: '-__v' })
    const sort = getSort(req, 'name')
    const searchTerm = getSearchQuery(req)

    const total = await this.associationService.count()
    const items = await this.associationService.get({
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
}
