import { sanitizeForRegex } from '../../../src/utils/sanitize'

describe('sanitization utils', () => {
  describe('sanitizeForRegex', () => {
    it.each(['apple', 'Green', 'Colorful Days'])(
      'should leave normal characters',
      (input) => {
        expect(sanitizeForRegex(input)).toBe(input)
      },
    )

    it.each(['\\', '^', '$', '|', '?', '.', '*', '+', '(', ')', '[', ']', '{', '}'])(
      'should escape special characters',
      (input) => {
        expect(sanitizeForRegex(input)).toBe(`\\${input}`)
      },
    )

    it.each([
      ['Do not enter the kindergarten.', 'Do not enter the kindergarten\\.'],
      ['(I wanna hack U).*', '\\(I wanna hack U\\)\\.\\*'],
      ['My .* name$', 'My \\.\\* name\\$'],
    ])('should sanitize mixed strings', (input, result) => {
      expect(sanitizeForRegex(input)).toBe(result)
    })
  })
})
