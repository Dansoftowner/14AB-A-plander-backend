import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import { resolveOptions } from '../common-query-params'
import {
  MemberService,
  NotPresidentError,
  RegisteredMemberAlterError,
} from '../../services/member'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { ApiError } from '../error/api-error'
import { ApiErrorCode } from '../error/api-error-codes'
import { ClientInfo } from '../../utils/jwt'
import { MemberInviteDto } from '../../dto/member-invite'
import { MemberRegistrationDto } from '../../dto/member-registration'
import di from '../../di'
import { asValue } from 'awilix'
import { ForgottenPasswordDto, NewPasswordDto } from '../../dto/forgotten-password'
import { NewCredentialsDto } from '../../dto/new-credentials'
import { MemberUpdateDto } from '../../dto/member-update'

export class MemberController implements Controller {
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

  async getInvitedMember(req: Request, res: Response) {
    const { id, registrationToken } = req.params

    const member = await this.service(req).getInvited(id, registrationToken)

    if (!member) throw new ApiError(404, ApiErrorCode.INVALID_URL)

    res.send(instanceToPlain(member))
  }

  async inviteMember(req: Request, res: Response) {
    const payload = plainToInstance(MemberInviteDto, req.body)

    const invitedMember = await this.service(req).invite(payload)
    if (!invitedMember) throw new ApiError(422, ApiErrorCode.EMAIL_RESERVED)

    res.status(202).send(instanceToPlain(invitedMember))
  }

  async registerMember(req: Request, res: Response) {
    const { id, registrationToken } = req.params
    const payload = plainToInstance(MemberRegistrationDto, req.body)

    const registeredMember = await this.service(req).register(
      id,
      registrationToken,
      payload,
    )

    if (registeredMember === undefined)
      throw new ApiError(422, ApiErrorCode.USERNAME_ID_NUMBER_RESERVED)
    if (registeredMember === null) throw new ApiError(404, ApiErrorCode.INVALID_URL)

    res.status(200).send(instanceToPlain(registeredMember))
  }

  async labelForgottenPassword(req: Request, res: Response) {
    const payload = plainToInstance(ForgottenPasswordDto, req.body)

    const foundMember = await this.service(req).labelForgottenPassword(payload)
    if (!foundMember) throw new ApiError(422, ApiErrorCode.EMAIL_NOT_FOUND)

    res.status(202).send()
  }

  async restorePassword(req: Request, res: Response) {
    const { id, restorationToken } = req.params
    const payload = plainToInstance(NewPasswordDto, req.body)

    const isRestored = await this.service(req).restorePassword(
      id,
      restorationToken,
      payload,
    )

    if (!isRestored) throw new ApiError(404, ApiErrorCode.INVALID_URL)

    res.status(204).send()
  }

  async updateCredentials(req: Request, res: Response) {
    const payload = plainToInstance(NewCredentialsDto, req.body)

    const result = await this.service(req).updateCredentials(payload)

    if (result === null) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)
    if (result === undefined) throw new ApiError(422, ApiErrorCode.USERNAME_RESERVED)

    res.status(204).send()
  }

  async updateMember(req: Request, res: Response) {
    const id = req.params.id
    const payload = plainToInstance(MemberUpdateDto, req.body)

    try {
      const updated = await this.service(req).update(id, payload)
      if (!updated) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

      res.status(200).send(updated)
    } catch (err) {
      if (err instanceof NotPresidentError)
        throw new ApiError(403, ApiErrorCode.NOT_PRESIDENT)
      if (err instanceof RegisteredMemberAlterError)
        throw new ApiError(403, ApiErrorCode.REGISTERED_MEMBER_ALTER)
      throw err
    }
  }

  private service(req: Request): MemberService {
    if (!req.scope)
      return di
        .createScope()
        .register({ clientInfo: asValue(undefined) })
        .resolve('memberService')

    return req.scope!.resolve('memberService')
  }
}
