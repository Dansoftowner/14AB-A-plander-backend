import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import { resolveOptions } from '../common-query-params'
import { MemberService } from '../../services/member'
import { instanceToPlain } from 'class-transformer'
import { ApiError } from '../error/api-error'
import { ApiErrorCode } from '../error/api-error-codes'

export class MemberController implements Controller {
  private service(req: Request): MemberService {
    return req.scope!.resolve('memberService')
  }

  async getMembers(req: Request, res: Response) {
    const result = await this.service(req).get(resolveOptions(req))

    res.send(instanceToPlain(result))
  }

  async getMemberById(req: Request, res: Response) {
    const member = await this.service(req).getById(req.params.id, resolveOptions(req))

    if (!member) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

    res.send(instanceToPlain(member))
  }
}
