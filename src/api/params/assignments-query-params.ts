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

function extractStartDate(req: Request): Date {
  const raw = new Date(req.query.start as string)
  return isValid(raw) ? raw : startOfMonth(new Date())
}

function extractEndDate(req: Request): Date {
  const raw = new Date(req.query.end as string)
  return isValid(raw) ? raw : endOfMonth(new Date())
}
