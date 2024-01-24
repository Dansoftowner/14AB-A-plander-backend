/**
 * Determines whether the given value is an iterable.
 */
export function isIterable(value: any): boolean {
  return value && typeof value['forEach'] === 'function'
}

/**
 * Returns the first value that is not falsy.
 */
export function notFalsy<T>(...values: (T | null | undefined)[]): T {
  return values.find((it) => it)!
}
