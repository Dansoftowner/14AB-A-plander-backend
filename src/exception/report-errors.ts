/**
 * Thrown when the client wants to create a report with an assignment that doesn't really exist.
 */
export class AssignmentNotFoundError extends Error {}

/**
 * Thrown when a client wants to create a report for an assignment that he is not an assignee of.
 */
export class ReporterIsNotAssigneeError extends Error {}

/**
 * Thrown when a client wants to create a report for an assignment that already has a report.
 */
export class ReportAlreadyExistsError extends Error {}

/**
 * Thrown when a client wants to fetch a report that doesn't exist
 */
export class ReportNotFoundError extends Error {}

/**
 * Thrown when a client wants to submit a report for an assignment that is not over yet
 */
export class AssignmentIsNotOverError extends Error {}

/**
 * Thrown when a client wants to update a too old report.
 */
export class ReportCannotBeUpdatedError extends Error {}

/**
 * Thrown when a client who is not an author wants to update a report.
 */
export class ReportUpdaterIsNotAuthorError extends Error {}