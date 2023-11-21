import { Request } from 'express'
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
  LIMIT_PARAM_NAME,
  MAX_LIMIT,
  OFFSET_PARAM_NAME,
  getPaginationData,
} from '../../../src/utils/pagination'

describe('pagination data extractor utility', () => {
  let offset: string
  let limit: string

  const execute = () => {
    const req = { query: {} }

    req.query[OFFSET_PARAM_NAME] = offset
    req.query[LIMIT_PARAM_NAME] = limit

    return getPaginationData(req as Request)
  }

  it.each([
    ['111', 111],
    ['12abc', 12],
    ['323', 323],
  ])('should return offset as number', (raw, number) => {
    offset = raw

    expect(execute().offset).toBe(number)
  })

  it.each([
    ['9', 9],
    ['23fga', 23],
    ['3a8', 3],
  ])('should return limit as number', (raw, number) => {
    limit = raw

    expect(execute().limit).toBe(number)
  })

  it.each([['asdf'], ['ewe12'], ['-120']])(
    'should return default offset & limit if the given ones are not valid numbers',
    (raw) => {
      limit = offset = raw

      expect(execute().offset).toBe(DEFAULT_OFFSET)
      expect(execute().limit).toBe(DEFAULT_LIMIT)
    },
  )

  it('should not return limit larger than the maximum', () => {
    limit = (MAX_LIMIT + 123).toString()

    expect(execute().limit).toBe(MAX_LIMIT)
  })
})
