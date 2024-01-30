import { Controller } from '../../base/controller'
import { RoutesProvider } from '../../base/routes-provider'
import { ReportDto } from '../../dto/report'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import auth from '../../middlewares/auth'
import validate from '../../middlewares/validate'
import validateObjectId from '../../middlewares/validate-objectid'
import { ReportController } from '../controllers/report'

export class ReportRoutes extends RoutesProvider {
  constructor({ reportController }) {
    super(reportController)
  }

  override get prefix(): string {
    return 'assignments'
  }

  protected initializeRoutes(controller: ReportController): void {
    /**
     * @openapi
     * /api/assignments/{id}/report:
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
     *    parameters:
     *      - in: path
     *        name: id
     *        schema:
     *          type: string
     *          required: true
     *        description: The unique id of the assignment.
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
      '/:id/report',
      auth,
      validateObjectId,
      validate(ReportDto.validationSchema()),
      asyncErrorHandler((req, res) => controller.createReport(req, res)),
    )

    /**
     * @openapi
     * /api/assignments/{id}/report:
     *  get:
     *    tags:
     *      - Reports
     *    description: |
     *       Fetches the report that is mapped to the given assignment.
     *
     *       **Authentication is required** before using this endpoint.
     *    parameters:
     *      - in: path
     *        name: id
     *        schema:
     *          type: string
     *          required: true
     *        description: The unique id of the assignment.
     *    responses:
     *      200:
     *        description: Request was successfull. Returns the information about the report.
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/Report'
     *      400:
     *        $ref: '#/components/responses/InvalidObjectId'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      404:
     *        description: |
     *          Either the assignment or the report doesn't exist.
     *
     *          Error code might be `missing-resource` or `report-not-exist`.
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/Error'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.get(
      '/:id/report', 
      auth, 
      validateObjectId,
      asyncErrorHandler((req, res) => controller.getReport(req, res)),
    )

    /**
     * @openapi
     * /api/assignments/{id}/report/pdf:
     *  get:
     *    tags:
     *      - Reports
     *    description: |
     *       Generates a PDF document for the given report.
     *
     *       **Authentication is required** before using this endpoint.
     *    parameters:
     *      - in: path
     *        name: id
     *        schema:
     *          type: string
     *          required: true
     *        description: The unique id of the assignment.
     *    responses:
     *      200:
     *        description: PDF is successfully generated.
     *        content:
     *          application/pdf:
     *            schema:
     *              type: string
     *              format: binary
     *      400:
     *        $ref: '#/components/responses/InvalidObjectId'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      404:
     *        description: |
     *          Either the assignment or the report doesn't exist.
     *
     *          Error code might be `missing-resource` or `report-not-exist`.
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/Error'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.get(
      '/:id/report/pdf',
      auth,
      validateObjectId,
      asyncErrorHandler((req, res) => controller.getReportPdf(req, res)),
    )
  }
}
