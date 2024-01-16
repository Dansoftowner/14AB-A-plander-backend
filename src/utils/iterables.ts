export function isIterable(value: any): boolean {
  return value && typeof value['forEach'] === 'function'
}
