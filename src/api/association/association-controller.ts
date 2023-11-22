import _ from 'lodash'
import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import AssociationService from './association-service'
import {
  getPaginationInfo,
  getProjection,
  getSearchQuery,
  getSort,
} from '../api-commons'

export default class AssociationController implements Controller {
  private associationService: AssociationService

  constructor({ associationService }) {
    this.associationService = associationService
  }

  async getAssociations(req: Request, res: Response) {
    const paginationInfo = getPaginationInfo(req)
    const projection = getProjection(req, { lite: '_id name', full: '' })
    const sort = getSort(req, 'name')
    const searchTerm = getSearchQuery(req)

    const items = await this.associationService.get({
      paginationInfo,
      projection,
      sort,
      searchTerm,
    })

    res.json(items)
  }
}
