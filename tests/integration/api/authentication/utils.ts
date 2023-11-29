import supertest from 'supertest'
import config from 'config'

export interface CookieInfo {
  cookie: string | undefined
  isHttpOnly: boolean | undefined
  isSameSiteLax: boolean | undefined
  maxAge: number | undefined
  token: string | undefined
}

export function getAuthCookieInfo(res: supertest.Response): CookieInfo {
  const cookieName: string = config.get('jwt.cookieName')

  const rawCookies = res.headers['set-cookie'] as unknown as string[]
  const cookie = rawCookies.find((it) => it.startsWith(cookieName))

  const isHttpOnly = cookie?.includes('HttpOnly;')
  const isSameSiteLax = cookie?.includes('SameSite=Lax')
  const maxAge = retrieveMaxAge(cookie)

  const token = cookie?.substring(
    cookie.indexOf(cookieName) + cookieName.length + 1,
    cookie.indexOf(';'),
  )

  return { cookie, isHttpOnly, isSameSiteLax, maxAge, token }
}

function retrieveMaxAge(cookie: string | undefined): number | undefined {
  if (!cookie) return undefined

  let i = cookie.indexOf('Max-Age')
  if (i < 0) return undefined

  i += 'Max-Age'.length + 1

  let maxAge: string = ''
  while (cookie[i] !== ';') {
    maxAge += cookie[i]
    i++
  }

  return parseInt(maxAge)
}
