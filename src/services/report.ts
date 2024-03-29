import { plainToInstance } from 'class-transformer'
import handlebars from 'handlebars'
import { Service } from '../base/service'
import { ReportDto } from '../dto/report/report'
import { ReportRepository } from '../repositories/report'
import { ClientInfo } from '../utils/jwt'
import { readFileSync } from 'fs'
import puppeteer from 'puppeteer'
import { Readable } from 'stream'
import { AssignmentRepository } from '../repositories/assignment'
import { ReportNotFoundError } from '../exception/report-errors'
import { AssociationRepository } from '../repositories/association'
import { differenceInHours, format } from 'date-fns'
import { convertHtmlToPdf } from '../utils/pdf'
import i18n from '../utils/i18n'
import { AssignmentDto } from '../dto/assignment/assignment'
import { ReportUpdateDto } from '../dto/report/report-update'

export class ReportService implements Service {
  constructor(
    private clientInfo: ClientInfo,
    private reportRepository: ReportRepository,
  ) {}

  async create(assignmentId: string, payload: ReportDto): Promise<ReportDto> {
    const created = await this.reportRepository.create(assignmentId, payload)

    return plainToInstance(ReportDto, created, {
      excludeExtraneousValues: true,
    })
  }

  /**
   * @throws ReportNotFoundError if the assignment has no report
   */
  async get(assignmentId: string): Promise<ReportDto | null> {
    const report = await this.reportRepository.get(
      this.clientInfo.association,
      assignmentId,
    )

    return plainToInstance(ReportDto, report, {
      excludeExtraneousValues: true,
    })
  }

  /**
   * @throws ReportNotFoundError if the assignment has no report
   */
  async getPdf(assignmentId: string): Promise<Readable | null> {
    // assembling HTML for the report
    const rawTemplate = readFileSync('./resources/pdf-templates/report.hbs')
    const template = handlebars.compile(rawTemplate.toString())

    const pdfInfo = await this.loadPdfInformation(assignmentId)
    if (!pdfInfo) return null

    const html = template(pdfInfo, {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    })

    return await convertHtmlToPdf(html, { format: 'A4' })
  }

  /**
   * @throws ReportNotFoundError
   * @throws ReportUpdaterIsNotAuthorError
   * @throws ReportCannotBeUpdatedError
   */
  async update(assignmentId: string, payload: ReportUpdateDto): Promise<ReportDto> {
    const updated = await this.reportRepository.update(assignmentId, payload)

    return plainToInstance(ReportDto, updated, {
      excludeExtraneousValues: true,
    })
  }

  /**
   * @throws ReportNotFoundError
   * @throws ReportUpdaterIsNotAuthorError
   * @throws ReportCannotBeUpdatedError
   */
  async delete(assignmentId: string): Promise<ReportDto> {
    const deleted = await this.reportRepository.delete(assignmentId)

    return plainToInstance(ReportDto, deleted, {
      excludeExtraneousValues: true,
    })
  }

  /**
   * Loads all information needed for the PDF report.
   *
   * @param assignmentId the id of the given assignment
   * @returns the object that can be directly passed to the templating engine
   * @throws ReportNotFoundError if the assignment has no report
   */
  private async loadPdfInformation(assignmentId: string): Promise<object> {
    const assignment =
      await this.reportRepository.findAssignmentWithReport(assignmentId)

    return (
      assignment && {
        assignment,
        association: assignment.association,
        report: assignment.report,

        // Calculation:
        serviceDuration: differenceInHours(assignment.end, assignment.start),
        kmSpan: assignment.report.endKm - assignment.report.startKm,

        start: format(assignment.start, 'yyyy.MM.dd HH:mm'),
        end: format(assignment.end, 'yyyy.MM.dd HH:mm'),

        method: i18n.getResource('hu', 'report', assignment.report.method),
        isVehicle: assignment.report.method === 'vehicle',
      }
    )
  }
}
