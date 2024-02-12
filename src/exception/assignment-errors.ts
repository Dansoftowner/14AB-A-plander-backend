/**
 * Thrown when the client wants to create an assignment with an assignee who doesn't really exist.
 */
export class AssigneeNotFoundError extends Error {}

/**
 * Thrown when the client wants to update the start or end time of an assignment
 * to an invalid value (start > end or end < start).
 */
export class InvalidTimeBoundariesError extends Error {}

/**
 * Thrown when the client wants to insert an assignment that's in the past.
 */
export class InsertionInThePastError extends Error {}
