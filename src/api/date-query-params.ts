import { Request } from 'express'
import { isValid, startOfMonth, endOfMonth } from 'date-fns'

export const START_DATE_TIME_PARAM = 'start'
export const END_DATE_TIME_PARAM = 'end'

export interface DateQueryOptions {
  start: Date
  end: Date
}

export function resolveDateQueryOptions(req: Request): DateQueryOptions {
  return {
    start: extractStartDate(req),
    end: extractEndDate(req),
  }
}

function extractStartDate(req: Request): Date {
  const raw = new Date(req.query[START_DATE_TIME_PARAM] as string)
  return isValid(raw) ? raw : startOfMonth(new Date())
}

function extractEndDate(req: Request): Date {
  const raw = new Date(req.query[END_DATE_TIME_PARAM] as string)
  return isValid(raw) ? raw : endOfMonth(new Date())
}
