import { Request, Response, NextFunction } from 'express'
import config from 'config'
import { asValue } from 'awilix'
import { ApiError } from '../api/error/api-error'
import { ApiErrorCode } from '../api/error/api-error-codes'
import container from '../di'
import { ClientInfo, verifyToken } from '../utils/jwt'
import { MemberRepository } from '../repositories/member'
import di from '../di'
import asyncErrorHandler from './async-error-handler'

export default asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = retrieveToken(req)
    if (!token) throw new ApiError(401, ApiErrorCode.UNAUTHORIZED)

    const jwtPayload = decodeJwt(token)
    jwtPayload.roles = await fetchRoles(jwtPayload._id, jwtPayload.association)

    req.scope = container.createScope()
    req.scope.register({ clientInfo: asValue(jwtPayload) })

    next()
  },
)

function retrieveToken(req: Request): string | undefined {
  const headerName: string = config.get('jwt.headerName')
  return headerName ? req.header(headerName) : undefined
}

function decodeJwt(token: string): ClientInfo {
  try {
    return verifyToken(token)
  } catch (e) {
    throw new ApiError(400, ApiErrorCode.INVALID_TOKEN)
  }
}

async function fetchRoles(id: string, associationId: string): Promise<string[]> {
  const memberRepository: MemberRepository = di.cradle.memberRepository

  const member = await memberRepository.findById(id, {
    associationId,
    projection: 'roles',
  })

  return member?.roles ?? []
}
