import { Request, Response, NextFunction } from 'express'
import config from 'config'
import { asValue } from 'awilix'
import { ApiError } from '../api/error/api-error'
import { ApiErrorCode } from '../api/error/api-error-codes'
import container from '../di'
import { MemberInfo, decodeMemberInfo } from '../utils/jwt'

export default (req: Request, res: Response, next: NextFunction) => {
  const token = retrieveToken(req)
  if (!token) throw new ApiError(401, ApiErrorCode.UNAUTHORIZED)

  let memberInfo: MemberInfo
  try {
    memberInfo = decodeMemberInfo(token)
  } catch (e) {
    throw new ApiError(400, ApiErrorCode.INVALID_TOKEN)
  }

  req.scope = container.createScope()
  req.scope.register({ memberInfo: asValue(memberInfo) })
  next()
}

function retrieveToken(req: Request): string | undefined {
  const cookie = getAuthCookie(req)
  const header = getAuthHeader(req)

  return cookie ?? header
}

function getAuthHeader(req: Request): string | undefined {
  const headerName: string = config.get('jwt.headerName')
  return headerName ? req.header(headerName) : undefined
}

function getAuthCookie(req: Request): string | undefined {
  const cookieName: string = config.get('jwt.cookieName')
  req.cookies = req.cookies || {}
  return cookieName ? req.cookies[cookieName] : undefined
}
