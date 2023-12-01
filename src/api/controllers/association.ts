import _ from 'lodash'
import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import AssociationService from '../../services/association'
import {
  getPaginationInfo,
  getProjection,
  getSearchQuery,
  getSort,
} from '../common-query-params'
import { ApiError } from '../../api/error/api-error'
import { ApiErrorCode } from '../error/api-error-codes'
import { instanceToPlain } from 'class-transformer'
import { MemberInfo } from '../../utils/jwt'

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

    res.json(instanceToPlain(items))
  }

  async getAssociationById(req: Request, res: Response) {
    const id = req.params.id
    const projection = this.resolveProjection(req)

    const item = await this.service.getById(id, projection)

    if (!item) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

    res.json(instanceToPlain(item))
  }

  async getMyAssociation(req: Request, res: Response) {
    const memberInfo: MemberInfo = req.scope!.resolve('memberInfo')
    req.params.id = memberInfo.association

    await this.getAssociationById(req, res)
  }

  private resolveProjection(req: Request) {
    return getProjection(req, { lite: '_id name', full: '' })
  }
}
