export function isIterable(value: any): boolean {
  return value && typeof value['forEach'] === 'function'
}

export function nonNull(...values) {
  return values.find((it) => !!it)
}
