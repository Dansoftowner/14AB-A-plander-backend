import { Controller } from '../../base/controller'
import { RoutesProvider } from '../../base/routes-provider'
import { ReportDto } from '../../dto/report'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import auth from '../../middlewares/auth'
import validate from '../../middlewares/validate'
import { ReportController } from '../controllers/report'

export class ReportRoutes extends RoutesProvider {
  constructor({ reportController }) {
    super(reportController)
  }

  override get prefix(): string {
    return '/assignments/:assignmentId/report'
  }

  protected initializeRoutes(controller: ReportController): void {
    /**
     * @openapi
     * /api/reports:
     *  post:
     *    tags:
     *      - Reports
     *    description: |
     *       Allows members to submit reports about assignments.
     *
     *       - **Only members who were assignees of the particular assignment can submit reports.**
     *       - **However, only one report can be submitted for a particular assignment.** Additional reports are rejected.
     *
     *       **Authentication is required** before using this endpoint.
     *    requestBody:
     *      required: true
     *      content:
     *       application/json:
     *        schema:
     *         $ref: '#/components/schemas/Report'
     *    responses:
     *      201:
     *        description: Insertion proceeded. Returns the information about the submitted report.
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/Report'
     *      400:
     *        $ref: '#/components/responses/InvalidPayload'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      403:
     *       $ref: '#/components/responses/ReporterIsNotAssignee'
     *      409:
     *       $ref: '#/components/responses/ReportAlreadyExists'
     *      422:
     *       $ref: '#/components/responses/AssignmentNotFound'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.post(
      '/',
      auth,
      validate(ReportDto.validationSchema()),
      asyncErrorHandler((req, res) => controller.createReport(req, res)),
    )

    this.router.get(
      '/pdf',
      auth,
      asyncErrorHandler((req, res) => controller.getReportPdf(req, res)),
    )
  }
}
