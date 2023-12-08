import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import { resolveOptions } from '../common-query-params'
import { MemberService } from '../../services/member'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { ApiError } from '../error/api-error'
import { ApiErrorCode } from '../error/api-error-codes'
import { ClientInfo } from '../../utils/jwt'
import { MemberInviteDto } from '../../dto/member-invite'

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

  async getMe(req: Request, res: Response) {
    const clientInfo: ClientInfo = req.scope!.resolve('clientInfo')
    req.params.id = clientInfo._id

    await this.getMemberById(req, res)
  }

  async getMemberByUsername(req: Request, res: Response) {
    const member = await this.service(req).getByUsername(
      req.params.username,
      resolveOptions(req),
    )

    if (!member) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

    res.send(instanceToPlain(member))
  }

  async inviteMember(req: Request, res: Response) {
    const payload = plainToInstance(MemberInviteDto, req.body)

    const invitedMember = await this.service(req).invite(payload)
    if (!invitedMember) throw new ApiError(422, ApiErrorCode.EMAIL_RESERVED)

    res.send(instanceToPlain(invitedMember))
  }
}
