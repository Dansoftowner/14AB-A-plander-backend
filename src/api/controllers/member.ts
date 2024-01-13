import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import { resolveOptions } from '../params/common-query-params'
import { MemberService } from '../../services/member'
import {
  EmailReservedError,
  NoOtherPresidentError,
  UsernameReservedError,
} from '../../exception/member-errors'
import { PresidentDeletionError } from '../../exception/member-errors'
import { RegisteredMemberAlterError } from '../../exception/member-errors'
import { NotPresidentError } from '../../exception/member-errors'
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
import { ValueReservedError } from '../../exception/value-reserved-error'
import { MemberPreferencesDto } from '../../dto/member-preferences'

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

    try {
      const registeredMember = await this.service(req).register(
        id,
        registrationToken,
        payload,
      )

      if (!registeredMember) throw new ApiError(404, ApiErrorCode.INVALID_URL)

      res.status(200).send(instanceToPlain(registeredMember))
    } catch (err) {
      if (err instanceof ValueReservedError)
        throw new ApiError(422, ApiErrorCode.USERNAME_ID_NUMBER_RESERVED)
      throw err
    }
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

    try {
      const result = await this.service(req).updateCredentials(payload)
      if (!result) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)
      res.status(204).send()
    } catch (err) {
      if (err instanceof UsernameReservedError)
        throw new ApiError(422, ApiErrorCode.USERNAME_RESERVED)
      if (err instanceof EmailReservedError)
        throw new ApiError(422, ApiErrorCode.EMAIL_RESERVED)
      throw err
    }
  }

  async getMyPreferences(req: Request, res: Response) {
    const prefs = await this.service(req).getPreferences()

    if (!prefs) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

    res.status(200).send(prefs)
  }

  async updateMyPreferences(req: Request, res: Response) {
    const payload = plainToInstance(MemberPreferencesDto, req.body)

    const prefs = await this.service(req).updatePreferences(payload)

    if (!prefs) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

    res.status(200).send(prefs)
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
      if (err instanceof ValueReservedError)
        throw new ApiError(409, ApiErrorCode.ID_NUMBER_RESERVED)
      throw err
    }
  }

  async updateMe(req: Request, res: Response) {
    const clientInfo: ClientInfo = req.scope!.resolve('clientInfo')
    req.params.id = clientInfo._id

    await this.updateMember(req, res)
  }

  async deleteMember(req: Request, res: Response) {
    const id = req.params.id

    try {
      const deletedMember = await this.service(req).delete(id)
      if (!deletedMember) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

      res.status(200).json(instanceToPlain(deletedMember))
    } catch (err) {
      if (err instanceof PresidentDeletionError)
        throw new ApiError(403, ApiErrorCode.PRESIDENT_DELETION)
      if (err instanceof NoOtherPresidentError)
        throw new ApiError(422, ApiErrorCode.NO_OTHER_PRESIDENTS)
      throw err
    }
  }

  async transferMyRoles(req: Request, res: Response) {
    const id = req.params.id
    const copy = req.query.copy === 'true'

    const result = await this.service(req).transferRoles(id, copy)

    if (!result) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

    res.status(200).send(instanceToPlain(result))
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
