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

export class ReportService implements Service {
  private clientInfo: ClientInfo
  private reportRepository: ReportRepository
  private assignmentRepository: AssignmentRepository
  private associationRepository: AssociationRepository

  constructor({
    clientInfo,
    reportRepository,
    assignmentRepository,
    associationRepository,
  }) {
    this.clientInfo = clientInfo
    this.reportRepository = reportRepository
    this.assignmentRepository = assignmentRepository
    this.associationRepository = associationRepository
  }

  async create(payload: ReportDto): Promise<ReportDto> {
    const created = await this.reportRepository.create(
      this.clientInfo.association,
      this.clientInfo._id,
      payload,
    )

    return plainToInstance(ReportDto, created, {
      excludeExtraneousValues: true,
    })
  }

  async getPdf(
    reportId: string,
  ): Promise<{ stream: Readable; close: () => Promise<void> }> {
    const { report, assignment, association } = await this.fetchReport(reportId)

    // assembling HTML for the report
    const rawTemplate = readFileSync('./resources/pdf-templates/report.hbs')
    const template = handlebars.compile(rawTemplate.toString())

    const html = template(
      {
        association,
        assignment,
        report,
      },
      {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
      },
    )

    // export html to PDF
    const browser = await puppeteer.launch({ headless: 'new' })
    const page = await browser.newPage()

    await page.setContent(html, { waitUntil: 'domcontentloaded' })

    const stream = await page.createPDFStream({ format: 'A4' })

    return {
      stream,
      close: async () => {
        await page.close()
        await browser.close()
      },
    }
  }

  private async fetchReport(reportId: string) {
    const report = await this.reportRepository.findById(reportId)
    if (!report) throw new ReportNotFoundError()

    const assignment = await this.assignmentRepository.findById(report.assignment, {
      associationId: this.clientInfo.association,
    })

    const association = await this.associationRepository.findById(
      assignment.association,
      {},
    )

    return { report, assignment, association }
  }
}
