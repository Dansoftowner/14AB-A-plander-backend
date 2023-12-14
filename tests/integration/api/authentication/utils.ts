import supertest from 'supertest'
import config from 'config'

export interface CookieInfo {
  cookie: string | undefined
  isHttpOnly: boolean | undefined
  isCrossSite: boolean | undefined
  maxAge: number | undefined
  expires: string | undefined
  token: string | undefined
}

export function getAuthCookieInfo(res: supertest.Response): CookieInfo {
  const cookieName: string = config.get('jwt.cookieName')

  const rawCookies = res.headers['set-cookie'] as unknown as string[]
  const cookie = rawCookies.find((it) => it.startsWith(cookieName))

  const isHttpOnly = cookie?.includes('HttpOnly;')
  const isCrossSite = cookie?.includes('SameSite=None')
  const maxAge = retrieveMaxAge(cookie)
  const expires = retrieveExpiry(cookie)

  const token = cookie?.substring(
    cookie.indexOf(cookieName) + cookieName.length + 1,
    cookie.indexOf(';'),
  )

  return { cookie, isHttpOnly, isCrossSite, maxAge, expires, token }
}

function retrieveMaxAge(cookie: string | undefined): number | undefined {
  const rawMaxAge = retrieveOption(cookie, 'Max-Age')
  if (!rawMaxAge) return undefined

  return parseInt(rawMaxAge)
}

function retrieveExpiry(cookie: string | undefined): string | undefined {
  return retrieveOption(cookie, 'Expires')
}

function retrieveOption(
  cookie: string | undefined,
  optionName: string,
): string | undefined {
  if (!cookie) return undefined

  let i = cookie.indexOf(optionName)
  if (i < 0) return undefined

  i += optionName.length + 1

  let option: string = ''

  while (cookie[i] !== ';' && i !== cookie.length - 1) {
    option += cookie[i]
    i++
  }

  return option
}
