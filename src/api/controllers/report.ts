import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { ReportDto } from '../../dto/report'
import { ReportService } from '../../services/report'
import {
  AssignmentIsNotOverError,
  AssignmentNotFoundError,
  ReportAlreadyExistsError,
  ReportNotFoundError,
  ReporterIsNotAssigneeError,
} from '../../exception/report-errors'
import { ApiErrorCode } from '../error/api-error-codes'
import { ApiError } from '../error/api-error'

export class ReportController implements Controller {
  async createReport(req: Request, res: Response) {
    const assignmentId = req.params.id
    const payload = plainToInstance(ReportDto, req.body)

    try {
      const result = await this.service(req).create(assignmentId, payload)

      res.status(201).send(instanceToPlain(result))
    } catch (ex) {
      if (ex instanceof AssignmentIsNotOverError)
        throw new ApiError(422, ApiErrorCode.ASSIGNMENT_NOT_OVER)
      if (ex instanceof ReportAlreadyExistsError)
        throw new ApiError(409, ApiErrorCode.REPORT_ALREADY_EXISTS)
      if (ex instanceof ReporterIsNotAssigneeError)
        throw new ApiError(403, ApiErrorCode.REPORTER_IS_NOT_ASSIGNEE)
      if (ex instanceof AssignmentNotFoundError)
        throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)
      throw ex
    }
  }

  async getReport(req: Request, res: Response) {
    const assignmentId = req.params.id

    try {
      const report = await this.service(req).get(assignmentId)
      if (!report) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

      res.status(200).send(report)
    } catch (ex) {
      if (ex instanceof ReportNotFoundError)
        throw new ApiError(404, ApiErrorCode.REPORT_DOES_NOT_EXIST)
      throw ex
    }
  }

  async getReportPdf(req: Request, res: Response) {
    const assignmentId = req.params.id

    try {
      const pdfStream = await this.service(req).getPdf(assignmentId)
      if (!pdfStream) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

      const filename = `report_${assignmentId}.pdf`

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment;filename=${filename}`,
      })

      pdfStream.pipe(res)
    } catch (ex) {
      if (ex instanceof ReportNotFoundError)
        throw new ApiError(404, ApiErrorCode.REPORT_DOES_NOT_EXIST)
      throw ex
    }
  }

  async updateReport(req: Request, res: Response) {
    const assignmentId = req.params.id
    const payload = plainToInstance(ReportDto, req.body)

    try {
      const result = await this.service(req).update(assignmentId, payload)

      if (!result) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

      res.status(200).send(instanceToPlain(result))
    } catch (ex) {
      if (ex instanceof ReportNotFoundError)
        throw new ApiError(404, ApiErrorCode.REPORT_DOES_NOT_EXIST)
      throw ex
    }
  }

  private service(req: Request): ReportService {
    return req.scope!.resolve('reportService')
  }
}
