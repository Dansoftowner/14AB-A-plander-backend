/**
 * Matches all the special characters that a regular expression can contain
 */
const REGEX_SPECIAL_CHARS = /(\\|\^|\$|\.|\||\?|\*|\+|\(|\)|\[|\]|\{|\})/g

export function sanitizeForRegex(input: string): string {
  return input.replace(REGEX_SPECIAL_CHARS, '\\$1')
}
