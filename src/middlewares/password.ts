import config from 'config'
import { NextFunction, Request, Response } from 'express'
import { ClientInfo } from '../utils/jwt'
import { ApiErrorCode } from '../api/error/api-error-codes'
import { ApiError } from '../api/error/api-error'
import auth from './auth'
import { AuthenticationService } from '../services/authentication'
import { CredentialsDto } from '../dto/credentials'

/**
 * Can be applied to endpoints executing sensitive operations,
 * where specifying the current/old password is necessary.
 *
 * It must be used with the {@link auth} middleware together!
 */
export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = assembleCredentials(req)

    const authService: AuthenticationService = req.scope!.cradle.authenticationService
    const passwordValid = await authService.authWithoutToken(credentials)

    if (!passwordValid) throw new ApiError(401, ApiErrorCode.CURRENT_PASS_INVALID)

    next()
  } catch (err) {
    next(err)
  }
}

function assembleCredentials(req: Request): CredentialsDto {
  const clientInfo: ClientInfo = req.scope?.cradle.clientInfo

  if (!clientInfo)
    throw new Error('Authorization is required before applying the password-middleware')

  const providedPassword: string | undefined = req.header(
    config.get<string>('headers.currentPass'),
  )

  if (!providedPassword) throw new ApiError(401, ApiErrorCode.CURRENT_PASS_REQUIRED)

  const credentials = new CredentialsDto()
  credentials.associationId = clientInfo.association
  credentials.user = clientInfo._id
  credentials.password = providedPassword

  return credentials
}
