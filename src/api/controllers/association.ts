import _ from 'lodash'
import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import AssociationService from '../../services/association'
import { resolveOptions } from '../params/common-query-params'
import { ApiError } from '../../api/error/api-error'
import { ApiErrorCode } from '../error/api-error-codes'
import { instanceToPlain } from 'class-transformer'
import { ClientInfo } from '../../utils/jwt'

export default class AssociationController implements Controller {
  private service: AssociationService

  constructor({ associationService }) {
    this.service = associationService
  }

  async getAssociations(req: Request, res: Response) {
    const result = await this.service.get(resolveOptions(req))

    res.json(instanceToPlain(result))
  }

  async getAssociationById(req: Request, res: Response) {
    const item = await this.service.getById(req.params.id, resolveOptions(req))

    if (!item) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

    res.json(instanceToPlain(item))
  }

  async getMyAssociation(req: Request, res: Response) {
    const clientInfo: ClientInfo = req.scope!.resolve('clientInfo')
    req.params.id = clientInfo.association

    await this.getAssociationById(req, res)
  }
}
