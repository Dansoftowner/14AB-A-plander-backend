import config from 'config'
import bcrypt from 'bcrypt'
import { NextFunction, Request, Response } from 'express'
import { ClientInfo } from '../utils/jwt'
import { MemberRepository } from '../repositories/member'
import { ApiErrorCode } from '../api/error/api-error-codes'
import { ApiError } from '../api/error/api-error'
import auth from './auth'

/**
 * Can be applied to endpoints executing sensitive operations,
 * where specifying the current/old password is necessary.
 *
 * It must be used with the {@link auth} middleware together!
 */
export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientInfo: ClientInfo = req.scope?.resolve('clientInfo')

    if (!clientInfo)
      throw new Error(
        'Authorization is required before applying the password-middleware',
      )

    const providedPassword: string | undefined = req.header(
      config.get<string>('headers.currentPass'),
    )

    if (!providedPassword) throw new ApiError(401, ApiErrorCode.CURRENT_PASS_REQUIRED)

    const memberRepository: MemberRepository = req.scope!.resolve('memberRepository')

    const databaseEntry = await memberRepository.findById(clientInfo._id, {
      associationId: clientInfo.association,
      projection: 'password',
    })

    const passwordValid = await bcrypt.compare(
      providedPassword,
      databaseEntry!.password!,
    )

    if (!passwordValid) throw new ApiError(401, ApiErrorCode.CURRENT_PASS_INVALID)

    next()
  } catch (err) {
    next(err)
  }
}
