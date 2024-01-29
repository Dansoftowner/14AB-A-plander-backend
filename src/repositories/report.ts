import ReportModel, { Report } from '../models/report'
import AssignmentModel from '../models/assignment'
import { Repository } from '../base/repository'
import { ReportDto } from '../dto/report'
import {
  AssignmentNotFoundError,
  ReportAlreadyExistsError,
  ReportNotFoundError,
  ReporterIsNotAssigneeError,
} from '../exception/report-errors'
import mongoose from 'mongoose'
import assignment from '../models/assignment'
import { ClientInfo } from '../utils/jwt'

export class ReportRepository implements Repository {
  /**
   * @throws AssignmentNotFoundError
   * @throws SubmitterIsNotAssigneeError
   */
  async create(
    associationId: string,
    assignmentId: string,
    memberId: string,
    payload: ReportDto,
  ): Promise<Report> {
    const targetAssignment = await AssignmentModel.findOne({
      _id: assignmentId,
      association: associationId,
    })

    if (!targetAssignment) throw new AssignmentNotFoundError()

    const memberAssignee = targetAssignment.assignees.find(
      (it) => it._id.toHexString() === memberId,
    )

    if (!memberAssignee) throw new ReporterIsNotAssigneeError()
    if (targetAssignment.report) throw new ReportAlreadyExistsError()

    const report = new ReportModel({
      ...payload,
      member: memberId,
    })

    targetAssignment.report = report._id

    await report.save()
    await targetAssignment.save()

    return report
  }

  /**
   * Fetches the assignment populated with the association and assignment.
   *
   * @param assignmentId the id of the assignment
   * @throws ReportNotFoundError
   */
  async findAssignmentWithReport(assignmentId: string): Promise<any> {
    const assignment = await AssignmentModel.findById(assignmentId)
      .populate('association')
      .populate('report')

    if (assignment && !assignment.report) 
      throw new ReportNotFoundError()

    return assignment
  }
}
