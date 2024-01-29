import { plainToInstance } from 'class-transformer'
import handlebars from 'handlebars'
import { Service } from '../base/service'
import { ReportDto } from '../dto/report'
import { ReportRepository } from '../repositories/report'
import { ClientInfo } from '../utils/jwt'
import { readFileSync } from 'fs'
import puppeteer from 'puppeteer'
import { Readable } from 'stream'
import { AssignmentRepository } from '../repositories/assignment'
import { ReportNotFoundError } from '../exception/report-errors'
import { AssociationRepository } from '../repositories/association'
import { differenceInHours } from 'date-fns'
import { convertHtmlToPdf } from '../utils/pdf'

export class ReportService implements Service {
  private clientInfo: ClientInfo
  private repository: ReportRepository

  constructor({ clientInfo, reportRepository }) {
    this.clientInfo = clientInfo
    this.repository = reportRepository
  }

  async create(assignmentId: string, payload: ReportDto): Promise<ReportDto> {
    const created = await this.repository.create(
      this.clientInfo.association,
      assignmentId,
      this.clientInfo._id,
      payload,
    )

    return plainToInstance(ReportDto, created, {
      excludeExtraneousValues: true,
    })
  }

  async getPdf(assignmentId: string): Promise<Readable> {
    const assignment = await this.repository.findAssignmentById(assignmentId)

    // assembling HTML for the report
    const rawTemplate = readFileSync('./resources/pdf-templates/report.hbs')
    const template = handlebars.compile(rawTemplate.toString())

    const html = template(
      {
        assignment,
        association: assignment.association,
        report: assignment.report,
        // TODO: use handlebars helpers instead?
        serviceDuration: differenceInHours(
          assignment.start,
          assignment.end,
        ),
        kmSpan: assignment.report.endKm - assignment.report.startKm,
      },
      {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
      },
    )

    return await convertHtmlToPdf(html, { format: 'A4' })
  }
}
