/**
 * @file Provides utility funcitons for resolving common query parameters from http requests
 */

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

export interface CommonQueryOptions {
  offset: number
  limit: number
  projection: 'lite' | 'full'
  sort: string | undefined
  searchTerm: string | undefined
}

export function resolveOptions(req: Request): CommonQueryOptions {
  return {
    offset: extractOffset(req),
    limit: extractLimit(req),
    projection: extractProjection(req) as 'lite' | 'full',
    sort: extractSort(req, undefined!),
    searchTerm: extractSearchQuery(req),
  }
}

/**
 * @openapi
 * components:
 *   parameters:
 *     projectionParam:
 *       in: query
 *       name: projection
 *       schema:
 *         type: string
 *         enum: ['lite', 'full']
 *         default: 'lite'
 *       description: Specifies the projection mode.
 */
export function extractProjection(req: Request): string {
  let raw: string | undefined = req.query[PROJECTION_PARAM_NAME] as string
  if (!['lite', 'full'].includes(raw)) raw = undefined
  return raw || DEFAULT_PROJECTION
}

/**
 * @openapi
 * components:
 *  parameters:
 *    sortParam:
 *      in: query
 *      name: orderBy
 *      schema:
 *        type: string
 *        default: name
 *      description: Specifies the attribute used to sort the items.
 */
export function extractSort(req: Request, defaultSort: string): string {
  return (req.query[SORT_PARAM_NAME] as string) || defaultSort
}

/**
 * @openapi
 * components:
 *  parameters:
 *    searchQueryParam:
 *      in: query
 *      name: q
 *      schema:
 *        type: string
 *      description: Performs a search based on the given value.
 */
export function extractSearchQuery(req: Request): string | undefined {
  return req.query[SEARCH_PARAM_NAME]?.toString()
}

/**
 * @openapi
 * components:
 *    parameters:
 *      offsetParam:
 *        in: query
 *        name: offset
 *        schema:
 *          type: integer
 *          minimum: 0
 *          default: 0
 *        description: The number of items to skip before starting to collect the result set.
 */
export function extractOffset(req: Request): number {
  const raw = req.query[OFFSET_PARAM_NAME] as string

  let offsetNumber = parseInt(raw)

  if (!isNaN(offsetNumber)) offsetNumber = Math.max(offsetNumber, DEFAULT_OFFSET)

  return offsetNumber || DEFAULT_OFFSET
}

/**
 * @openapi
 * components:
 *  parameters:
 *    limitParam:
 *      in: query
 *      name: limit
 *      schema:
 *        type: integer
 *        minimum: 0
 *        maximum: 40
 *        default: 10
 *      description: The maximum number of items to return.
 */
export function extractLimit(req: Request): number {
  const raw = req.query[LIMIT_PARAM_NAME] as string

  let limitNumber = parseInt(raw)

  if (!isNaN(limitNumber)) {
    limitNumber = limitNumber < 0 ? DEFAULT_LIMIT : limitNumber
    limitNumber = Math.min(limitNumber, MAX_LIMIT)
  }

  return limitNumber || DEFAULT_LIMIT
}
