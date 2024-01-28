import ReportModel, { Report } from '../models/report'
import AssignmentModel from '../models/assignment'
import { Repository } from '../base/repository'
import { ReportDto } from '../dto/report'
import {
  AssignmentNotFoundError,
  ReportAlreadyExistsError,
  ReporterIsNotAssigneeError,
} from '../exception/report-errors'
import mongoose from 'mongoose'

export class ReportRepository implements Repository {
  /**
   * @throws AssignmentNotFoundError
   * @throws SubmitterIsNotAssigneeError
   */
  async create(
    associationId: string,
    memberId: string,
    payload: ReportDto,
  ): Promise<Report> {
    const targetAssignment = await AssignmentModel.findOne({
      _id: payload.assignment,
      association: associationId,
    })

    if (!targetAssignment) throw new AssignmentNotFoundError()

    const memberAssignee = targetAssignment.assignees.find(
      (it) => it._id.toHexString() === memberId,
    )

    if (!memberAssignee) throw new ReporterIsNotAssigneeError()

    const reportExists = await ReportModel.exists({ assignment: payload.assignment })
    if (reportExists) throw new ReportAlreadyExistsError()

    const report = new ReportModel({
      ...payload,
      member: memberId,
      assignment: payload.assignment,
    })

    return await report.save()
  }

  findById(id: string | mongoose.Types.ObjectId): Promise<Report | null> {
    return ReportModel.findById(id)
  }
}
