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
