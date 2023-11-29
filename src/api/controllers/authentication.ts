import _ from 'lodash'
import config from 'config'
import { CookieOptions, Request, Response } from 'express'
import { Controller } from '../../base/controller'
import { plainToInstance } from 'class-transformer'
import { CredentialsDto } from '../../dto/credentials'
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

    const token = await this.service.auth(payload)

    if (!token) throw new ApiError(401, ApiErrorCode.WRONG_CREDENTIALS)

    this.addTokenCooie(res, token, payload.isAutoLogin)
    res.json(token)
  }

  private addTokenCooie(res: Response, token: string, isAutoLogin: boolean) {
    const cookieOptions: CookieOptions = {
      sameSite: 'lax',
      httpOnly: true,
      secure: config.get('jwt.cookieSecure'),
    }

    if (isAutoLogin) cookieOptions.maxAge = 365 * 24 * 60 * 60 * 1000

    res.cookie(config.get('jwt.cookieName'), token, cookieOptions)
  }
}
