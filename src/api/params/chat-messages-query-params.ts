import { Request } from 'express'
import { extractLimit, extractOffset } from './common-query-params'

export interface ChatMessageQueryOptions {
  offset: number
  limit: number
}

export function resolveOptions(req: Request): ChatMessageQueryOptions {
  return {
    offset: extractOffset(req),
    limit: extractLimit(req),
  }
}
