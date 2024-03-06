export const SPECIAL_CHARACTERS = /[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?~]/
export const guardNumberPattern = () => /\d{2}\/\d{4}\/\d{5}/g
export const fullNamePattern = () => /^[^\d]+\s[^\d]+(\s[^\d]+)*$/g
export const emailPattern = () => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g

export function isFullName(name: string): boolean {
  return fullNamePattern().test(name) && !SPECIAL_CHARACTERS.test(name)
}

export function isEmail(email: string): boolean {
  return emailPattern().test(email)
}

export function isGuardNumber(guardNumber: string): boolean {
  return guardNumberPattern().test(guardNumber)
}

export function removeFlags(pattern: RegExp): RegExp {
  return new RegExp(pattern.source)
}
