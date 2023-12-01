import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import {
  getPaginationInfo,
  getProjection,
  getSearchQuery,
  getSort,
} from '../common-query-params'
import { MemberService } from '../../services/member'
import { instanceToPlain } from 'class-transformer'

export class MemberController implements Controller {
  private service(req: Request): MemberService {
    return req.scope!.resolve('memberService')
  }

  async getMembers(req: Request, res: Response) {
    const paginationInfo = getPaginationInfo(req)
    const projection = this.resolveProjection(req)
    const sort = getSort(req, 'name')
    const searchTerm = getSearchQuery(req)

    const result = await this.service(req).get({
      paginationInfo,
      projection,
      sort,
      searchTerm,
    })

    res.send(instanceToPlain(result))
  }

  private resolveProjection(req: Request) {
    return getProjection(req, {
      lite: '_id username name email phoneNumber isRegistered roles',
      full: '',
    })
  }
}
