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
  private report: ReportRepository

  constructor({ clientInfo, reportRepository }) {
    this.clientInfo = clientInfo
    this.report = reportRepository
  }

  async create(payload: ReportDto): Promise<ReportDto> {
    const created = await this.report.create(
      this.clientInfo.association,
      this.clientInfo._id,
      payload,
    )

    return plainToInstance(ReportDto, created, {
      excludeExtraneousValues: true,
    })
  }

  async getPdf(reportId: string): Promise<Readable> {
    const report = await this.report.fatFindById(reportId)

    // assembling HTML for the report
    const rawTemplate = readFileSync('./resources/pdf-templates/report.hbs')
    const template = handlebars.compile(rawTemplate.toString())

    const html = template(
      {
        report,
        association: report.association,
        assignment: report.assignment,
        serviceDuration: differenceInHours( // TODO: use handlebars helpers instead?
          report.assignment.start,
          report.assignment.end,
        ),
        kmSpan: report.endKm - report.startKm,
      },
      {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
      },
    )

    return await convertHtmlToPdf(html, { format: 'A4' })
  }
}
