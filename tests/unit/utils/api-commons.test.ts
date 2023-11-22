import { Request } from 'express'
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
  DEFAULT_PROJECTION,
  LIMIT_PARAM_NAME,
  MAX_LIMIT,
  OFFSET_PARAM_NAME,
  PROJECTION_PARAM_NAME,
  SEARCH_PARAM_NAME,
  SORT_PARAM_NAME,
  getPaginationData,
  getProjection,
  getSearchQuery,
  getSort,
} from '../../../src/utils/api-commons'

describe('api common utils', () => {
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

      const result = execute()

      expect(result.offset).toBe(number)
    })

    it.each([
      ['9', 9],
      ['23fga', 23],
      ['3a8', 3],
    ])('should return limit as number', (raw, number) => {
      limit = raw

      const result = execute()

      expect(result.limit).toBe(number)
    })

    it.each([['asdf'], ['ewe12'], ['-120']])(
      'should return default offset & limit if the given ones are not valid numbers',
      (raw) => {
        limit = offset = raw

        const result = execute()

        expect(result.offset).toBe(DEFAULT_OFFSET)
        expect(result.limit).toBe(DEFAULT_LIMIT)
      },
    )

    it('should not return limit larger than the maximum', () => {
      limit = (MAX_LIMIT + 123).toString()

      const result = execute()

      expect(result.limit).toBe(MAX_LIMIT)
    })
  })

  describe('projection extractor utility', () => {
    let projection: string
    let projectionMap: { lite: string; full: string } | undefined

    const execute = () => {
      const req = { query: {} }

      req.query[PROJECTION_PARAM_NAME] = projection

      return getProjection(req as Request, projectionMap)
    }

    beforeEach(() => {
      projectionMap = undefined
    })

    it.each(['lite', 'full'])('should return the projection', (input) => {
      projection = input

      const result = execute()

      expect(result).toBe(input)
    })

    it('should return the projection mapped to "lite"', () => {
      projection = 'lite'

      projectionMap = { full: '', lite: 'abc' }

      const result = execute()

      expect(result).toBe(projectionMap.lite)
    })

    it('should return the projection mapped to "full"', () => {
      projection = 'full'

      projectionMap = { full: 'abc', lite: '' }

      const result = execute()

      expect(result).toBe(projectionMap.full)
    })

    it('should return the default projection if the input is unknown', () => {
      projection = 'sgfw'

      projectionMap = { full: 'abc', lite: 'cba' }

      const result = execute()

      expect(result).toBe(projectionMap[DEFAULT_PROJECTION])
    })
  })

  describe('sort option extractor utility', () => {
    let sort: string | undefined
    let defaultSort: string | undefined

    const execute = () => {
      const req = { query: {} }

      req.query[SORT_PARAM_NAME] = sort

      return getSort(req as Request, defaultSort as string)
    }

    beforeEach(() => {
      sort = defaultSort = undefined
    })

    it('should return the given sort option', () => {
      sort = 'asdf'

      const result = execute()

      expect(result).toBe(sort)
    })

    it('should return the default sort', () => {
      defaultSort = 'sfsd'

      const result = execute()

      expect(result).toBe(defaultSort)
    })
  })

  describe('search query extractor utility', () => {
    let searchQuery: string | undefined

    const execute = () => {
      const req = { query: {} }

      req.query[SEARCH_PARAM_NAME] = searchQuery

      return getSearchQuery(req as Request)
    }

    it('should return undefined if there is no search query', () => {
      const result = execute()

      expect(result).toBe(searchQuery)
    })

    it('should return the given search query', () => {
      searchQuery = 'abc'

      const result = execute()

      expect(result).toBe(searchQuery)
    })
  })
})
