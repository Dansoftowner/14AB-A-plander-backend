import { Request } from 'express'
import _ from 'lodash'

export const OFFSET_PARAM_NAME = 'offset'
export const LIMIT_PARAM_NAME = 'limit'
export const PROJECTION_PARAM_NAME = 'projection'
export const SORT_PARAM_NAME = 'orderBy'
export const SEARCH_PARAM_NAME = 'q'

export const DEFAULT_OFFSET = 0
export const DEFAULT_LIMIT = 10
export const DEFAULT_PROJECTION = 'lite'
export const MAX_LIMIT = 40

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

export function getProjection(
  req: Request,
  projectionMap = {
    lite: 'lite',
    full: 'full',
  },
): string {
  const raw = req.query[PROJECTION_PARAM_NAME] as string
  if (_.keys(projectionMap).includes(raw)) return projectionMap[raw]
  return projectionMap[DEFAULT_PROJECTION]
}

export function getSort(req: Request, defaultSort: string): string {
  return (req.query[SORT_PARAM_NAME] as string) || defaultSort
}

export function getSearchQuery(req: Request): string | undefined {
  return req.query[SEARCH_PARAM_NAME]?.toString()
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
    limitNumber = limitNumber < 0 ? DEFAULT_LIMIT : limitNumber
    limitNumber = Math.min(limitNumber, MAX_LIMIT)
  }

  return limitNumber || DEFAULT_LIMIT
}
