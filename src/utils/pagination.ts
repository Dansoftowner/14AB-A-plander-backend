import { Request } from 'express'

export const DEFAULT_OFFSET = 0
export const DEFAULT_LIMIT = 10
export const MAX_LIMIT = 40

export const OFFSET_PARAM_NAME = 'offset'
export const LIMIT_PARAM_NAME = 'limit'

export interface PaginationData {
  offset: number
  limit: number
}

export function getPaginationData(req: Request): PaginationData {
  return {
    offset: extractOffset(req),
    limit: extractLimit(req),
  }
}

function extractOffset(req: Request): number {
  const raw = req.query[OFFSET_PARAM_NAME] as string

  let offsetNumber = parseInt(raw)

  if (!isNaN(offsetNumber)) offsetNumber = Math.max(offsetNumber, DEFAULT_OFFSET)

  return offsetNumber || DEFAULT_OFFSET
}

function extractLimit(req: Request): number {
  const raw = req.query[LIMIT_PARAM_NAME] as string

  let limitNumber = parseInt(raw)

  if (!isNaN(limitNumber)) {
    limitNumber = Math.max(limitNumber, DEFAULT_LIMIT)
    limitNumber = Math.min(limitNumber, MAX_LIMIT)
  }

  return limitNumber || DEFAULT_LIMIT
}
