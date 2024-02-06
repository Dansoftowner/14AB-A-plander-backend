import _ from 'lodash'
import config from 'config'
import { CookieOptions, Request, Response } from 'express'
import { Controller } from '../../base/controller'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { CredentialsDto } from '../../dto/member/credentials'
import { AuthenticationService } from '../../services/authentication'
import { ApiError } from '../error/api-error'
import { ApiErrorCode } from '../error/api-error-codes'

export class AuthenticationController implements Controller {
  private service: AuthenticationService

  constructor({ authenticationService }) {
    this.service = authenticationService
  }

  async auth(req: Request, res: Response) {
    const payload = plainToInstance(CredentialsDto, req.body)

    const authResult = await this.service.auth(payload)

    if (!authResult) throw new ApiError(401, ApiErrorCode.WRONG_CREDENTIALS)

    const { member, token } = authResult
    res.header(config.get('jwt.headerName'), token).json(instanceToPlain(member))
  }
}
