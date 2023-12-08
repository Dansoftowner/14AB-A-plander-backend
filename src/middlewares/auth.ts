import { Request, Response, NextFunction } from 'express'
import config from 'config'
import { asValue } from 'awilix'
import { ApiError } from '../api/error/api-error'
import { ApiErrorCode } from '../api/error/api-error-codes'
import container from '../di'
import { ClientInfo, verifyToken } from '../utils/jwt'

export default (req: Request, res: Response, next: NextFunction) => {
  const token = retrieveToken(req)
  if (!token) throw new ApiError(401, ApiErrorCode.UNAUTHORIZED)

  const jwtPayload = decodeJwt(token)

  req.scope = container.createScope()
  req.scope.register({ clientInfo: asValue(jwtPayload) })

  next()
}

function decodeJwt(token: string): ClientInfo {
  try {
    return verifyToken(token)
  } catch (e) {
    throw new ApiError(400, ApiErrorCode.INVALID_TOKEN)
  }
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
