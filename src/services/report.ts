import { plainToInstance } from 'class-transformer'
import { Service } from '../base/service'
import { ReportDto } from '../dto/report'
import { ReportRepository } from '../repositories/report'
import { ClientInfo } from '../utils/jwt'

export class ReportService implements Service {
  private clientInfo: ClientInfo
  private reportRepository: ReportRepository

  constructor({ clientInfo, reportRepository }) {
    this.clientInfo = clientInfo
    this.reportRepository = reportRepository
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
}
