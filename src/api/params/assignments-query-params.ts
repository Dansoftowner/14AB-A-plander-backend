import { Request } from 'express'
import { isValid, startOfMonth, endOfMonth } from 'date-fns'
import { extractProjection, extractSort } from './common-query-params'

export interface AssignmentsQueryOptions {
  start: Date
  end: Date
  projection: 'lite' | 'full'
  sort: string
}

export function resolveOptions(req: Request): AssignmentsQueryOptions {
  return {
    start: extractStartDate(req),
    end: extractEndDate(req),
    projection: extractProjection(req) as 'lite' | 'full',
    sort: extractSort(req, 'start'),
  }
}

/**
 * @openapi
 * components:
 *  parameters:
 *    startDateParam:
 *      in: query
 *      name: start
 *      schema:
 *        type: string
 *        format: date-time
 *      description: The start date-time of the period to query (if not specified, it will be the beginning of the month).
 */
function extractStartDate(req: Request): Date {
  const raw = new Date(req.query.start as string)
  return isValid(raw) ? raw : startOfMonth(new Date())
}

/**
 * @openapi
 * components:
 *  parameters:
 *    endDateParam:
 *      in: query
 *      name: end
 *      schema:
 *        type: string
 *        format: date-time
 *      description: The start date-time of the period to query (if not specified, it will be the end of the month).
 */
function extractEndDate(req: Request): Date {
  const raw = new Date(req.query.end as string)
  return isValid(raw) ? raw : endOfMonth(new Date())
}
