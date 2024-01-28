import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { ReportDto } from '../../dto/report'
import { ReportService } from '../../services/report'
import {
  AssignmentNotFoundError,
  ReportAlreadyExistsError,
  ReportNotFoundError,
  ReporterIsNotAssigneeError,
} from '../../exception/report-errors'
import { ApiErrorCode } from '../error/api-error-codes'
import { ApiError } from '../error/api-error'

export class ReportController implements Controller {
  async createReport(req: Request, res: Response) {
    const payload = plainToInstance(ReportDto, req.body)

    try {
      const result = await this.service(req).create(payload)

      res.status(201).send(instanceToPlain(result))
    } catch (ex) {
      if (ex instanceof ReportAlreadyExistsError)
        throw new ApiError(409, ApiErrorCode.REPORT_ALREADY_EXISTS)
      if (ex instanceof ReporterIsNotAssigneeError)
        throw new ApiError(403, ApiErrorCode.REPORTER_IS_NOT_ASSIGNEE)
      if (ex instanceof AssignmentNotFoundError)
        throw new ApiError(422, ApiErrorCode.ASSIGNMENT_NOT_FOUND)
      throw ex
    }
  }

  async getReportPdf(req: Request, res: Response) {
    const reportId = req.params.id

    try {
      const { stream, close } = await this.service(req).getPdf(reportId)

      res.set('Content-Type', 'application/pdf')
      res.on('finish', close)
      stream.pipe(res)
    } catch (ex) {
      if (ex instanceof ReportNotFoundError)
        throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

      // shouldn't happen
      if (ex instanceof AssignmentNotFoundError)
        throw new ApiError(422, ApiErrorCode.ASSIGNMENT_NOT_FOUND)
      throw ex
    }
  }

  private service(req: Request): ReportService {
    return req.scope!.resolve('reportService')
  }
}
