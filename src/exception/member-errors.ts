import { ValueReservedError } from './value-reserved-error'

/**
 * Thrown when a given operation is only allowed for presidents
 */
export class NotPresidentError extends Error {}

/**
 * Thrown when a (president) client wants to alter another member who is registered.
 */
export class RegisteredMemberAlterError extends Error {}

/**
 * Thrown when an president tries to delete another president
 */
export class PresidentDeletionError extends Error {}

/**
 * Thrown when a president tries to remove himself, but no other presidents are present in the group
 */
export class NoOtherPresidentError extends Error {}

/**
 * Thrown when the client wants a password that's already reserved
 */
export class UsernameReservedError extends ValueReservedError {}

/**
 * Thrown when the client wants an email that's already reserved
 */
export class EmailReservedError extends ValueReservedError {}
