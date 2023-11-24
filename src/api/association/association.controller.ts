import _ from 'lodash'
import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import AssociationService from './association.service'
import {
  getPaginationInfo,
  getProjection,
  getSearchQuery,
  getSort,
} from '../api-commons'
import { ApiError } from '../../exception/api-error'
import { ApiErrorCode } from '../../exception/api-error-codes'

export default class AssociationController implements Controller {
  private service: AssociationService

  constructor({ associationService }) {
    this.service = associationService
  }

  async getAssociations(req: Request, res: Response) {
    const paginationInfo = getPaginationInfo(req)
    const projection = getProjection(req, { lite: '_id name', full: '' })
    const sort = getSort(req, 'name')
    const searchTerm = getSearchQuery(req)

    const items = await this.service.get({
      paginationInfo,
      projection,
      sort,
      searchTerm,
    })

    res.json(items)
  }

  async getAssociationById(req: Request, res: Response) {
    const id = req.params.id

    const item = await this.service.getById(id)

    if (!item)
      throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE, 'Resource not found!') // TODO: i18n

    res.json(item)
  }
}
