import _ from 'lodash'
import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import AssociationService from '../../services/association'
import {
  getPaginationInfo,
  getProjection,
  getSearchQuery,
  getSort,
} from '../api-commons'
import { ApiError } from '../../exception/api-error'
import { ApiErrorCode } from '../../exception/api-error-codes'
import { instanceToPlain } from 'class-transformer'

export default class AssociationController implements Controller {
  private service: AssociationService

  constructor({ associationService }) {
    this.service = associationService
  }

  async getAssociations(req: Request, res: Response) {
    const paginationInfo = getPaginationInfo(req)
    const projection = this.resolveProjection(req)
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
    const projection = this.resolveProjection(req)

    const item = await this.service.getById(id, projection)

    if (!item)
      throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE, 'Resource not found!') // TODO: i18n

    res.json(instanceToPlain(item))
  }

  private resolveProjection(req: Request) {
    return getProjection(req, { lite: '_id name', full: '' })
  }
}
